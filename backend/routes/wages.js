const { z } = require("zod");
const { pool } = require("../db");

const wageSchema = z.object({
  wageMonth: z.string().regex(/^\d{4}-\d{2}$/)
});

const payoutSchema = z.object({
  employeeId: z.number().int().positive(),
  payoutMonth: z.string().regex(/^\d{4}-\d{2}$/),
  payoutType: z.enum(["salary", "advance"]).default("salary"),
  amount: z.number().positive(),
  paymentMethod: z.enum(["cash", "upi", "bank_transfer", "cheque"]).default("cash"),
  payoutDate: z.string().optional(),
  remarks: z.string().optional()
});

async function calculateWages(req, res, { readJson, sendJson }) {
  const { wageMonth } = wageSchema.parse(await readJson(req));
  const [rows] = await pool.query(
    `SELECT e.id, e.name, e.employee_type, e.gender, e.monthly_salary, e.daily_wage, e.wage_deduction,
            SUM(CASE WHEN a.status = 'present' THEN 1 WHEN a.status = 'half_day' THEN 0.5 WHEN a.status = 'sunday_off' AND e.employee_type = 'monthly_salary' THEN 1 ELSE 0 END) AS days_worked,
            SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absent_days
       FROM employees e
       LEFT JOIN attendance a
         ON a.employee_id = e.id AND DATE_FORMAT(a.attendance_date, '%Y-%m') = :wageMonth
      WHERE e.is_active = TRUE AND (e.is_deleted IS NULL OR e.is_deleted = 0)
      GROUP BY e.id
      ORDER BY e.name`,
    { wageMonth }
  );

  const [payoutRows] = await pool.query(
    `SELECT employee_id, payout_type, SUM(amount) AS total_amount
       FROM employee_payouts
      WHERE payout_month = :wageMonth
      GROUP BY employee_id, payout_type`,
    { wageMonth }
  );

  const payoutMap = {};
  payoutRows.forEach((p) => {
    if (!payoutMap[p.employee_id]) {
      payoutMap[p.employee_id] = { advance: 0, salary: 0 };
    }
    payoutMap[p.employee_id][p.payout_type] = Number(p.total_amount || 0);
  });

  const calculated = rows.map((row) => {
    const daysWorked = Number(row.days_worked || 0);
    const absentDays = Number(row.absent_days || 0);
    const salary = Number(row.monthly_salary || 0);
    const dailyWage = Number(row.daily_wage || 0);

    const baseAmount = row.employee_type === "monthly_salary" ? salary : dailyWage * daysWorked;
    const attendanceDeduction = row.employee_type === "monthly_salary" ? (salary / 30) * absentDays : 0;
    const deductionAmount = attendanceDeduction + Number(row.wage_deduction || 0);
    const grossPayable = Math.max(baseAmount - deductionAmount, 0);

    const empPayouts = payoutMap[row.id] || { advance: 0, salary: 0 };
    const advancePaid = empPayouts.advance;
    const salaryPaid = empPayouts.salary;
    const netPayable = Math.max(grossPayable - advancePaid - salaryPaid, 0);

    let payoutStatus = "pending";
    if (grossPayable > 0 && (salaryPaid + advancePaid) >= grossPayable) {
      payoutStatus = "paid";
    } else if ((salaryPaid + advancePaid) > 0) {
      payoutStatus = "partial";
    }

    return {
      ...row,
      days_worked: daysWorked,
      absent_days: absentDays,
      deduction_amount: deductionAmount,
      gross_payable: grossPayable,
      advance_paid: advancePaid,
      salary_paid: salaryPaid,
      payable_amount: netPayable,
      payout_status: payoutStatus
    };
  });

  sendJson(res, 200, calculated);
}

async function recordPayout(req, res, { readJson, sendJson }) {
  const payload = payoutSchema.parse(await readJson(req));

  const [employeeRows] = await pool.query(
    "SELECT id, name FROM employees WHERE id = ?",
    [payload.employeeId]
  );

  if (employeeRows.length === 0) {
    return sendJson(res, 404, { message: "Employee not found" });
  }

  const employee = employeeRows[0];
  const payoutDate = payload.payoutDate || new Date().toISOString().slice(0, 10);
  const remarksText = payload.remarks && payload.remarks.trim()
    ? payload.remarks.trim()
    : `${payload.payoutType === "advance" ? "Advance salary" : "Salary payout"} for ${payload.payoutMonth} via ${payload.paymentMethod.toUpperCase()}`;

  const [payoutResult] = await pool.query(
    `INSERT INTO employee_payouts
      (employee_id, payout_month, payout_type, amount, payment_method, payout_date, remarks)
     VALUES (:employeeId, :payoutMonth, :payoutType, :amount, :paymentMethod, :payoutDate, :remarksText)`,
    {
      employeeId: payload.employeeId,
      payoutMonth: payload.payoutMonth,
      payoutType: payload.payoutType,
      amount: payload.amount,
      paymentMethod: payload.paymentMethod,
      payoutDate,
      remarksText
    }
  );

  const provider = payload.paymentMethod === "cash" ? "cash" : "manual";
  await pool.query(
    `INSERT INTO payments
      (payment_gateway, payment_method, payment_status, amount, paid_at, remarks)
     VALUES (:provider, :paymentMethod, 'paid', :amount, NOW(), :paymentRemarks)`,
    {
      provider,
      paymentMethod: payload.paymentMethod,
      amount: payload.amount,
      paymentRemarks: `Employee ${payload.payoutType === "advance" ? "Advance" : "Salary"} Payout - ${employee.name} (${payload.payoutMonth})`
    }
  );

  sendJson(res, 201, {
    payoutId: Number(payoutResult.insertId),
    success: true,
    message: `${payload.payoutType === "advance" ? "Advance" : "Salary"} payment of ₹${payload.amount} recorded for ${employee.name}`
  });
}

async function getEmployeePayoutHistory(req, res, { sendJson }) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const employeeId = url.searchParams.get("employeeId");
  const search = url.searchParams.get("search") || "";

  let whereClauses = [];
  const params = {};

  if (employeeId) {
    whereClauses.push("p.employee_id = :employeeId");
    params.employeeId = employeeId;
  }

  if (search) {
    whereClauses.push("(e.name LIKE :search OR p.remarks LIKE :search OR p.payment_method LIKE :search)");
    params.search = `%${search}%`;
  }

  const whereSql = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

  const [rows] = await pool.query(
    `SELECT p.id, p.employee_id, e.name AS employee_name, e.employee_type, p.payout_month,
            p.payout_type, p.amount, p.payment_method, p.payout_date, p.remarks, p.created_at
       FROM employee_payouts p
       JOIN employees e ON e.id = p.employee_id
      ${whereSql}
      ORDER BY p.payout_date DESC, p.created_at DESC`,
    params
  );

  const totalSalaryPaid = rows.filter(r => r.payout_type === 'salary').reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const totalAdvancePaid = rows.filter(r => r.payout_type === 'advance').reduce((sum, r) => sum + Number(r.amount || 0), 0);

  sendJson(res, 200, {
    history: rows,
    summary: {
      totalSalaryPaid,
      totalAdvancePaid,
      totalPaid: totalSalaryPaid + totalAdvancePaid,
      totalTransactions: rows.length
    }
  });
}

module.exports = { calculateWages, recordPayout, getEmployeePayoutHistory };
