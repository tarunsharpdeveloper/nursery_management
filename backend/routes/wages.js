const { z } = require("zod");
const { pool } = require("../db");

const wageSchema = z.object({
  wageMonth: z.string().regex(/^\d{4}-\d{2}$/)
});

async function calculateWages(req, res, { readJson, sendJson }) {
  const { wageMonth } = wageSchema.parse(await readJson(req));
  const [rows] = await pool.query(
    `SELECT e.id, e.name, e.employee_type, e.gender, e.monthly_salary, e.daily_wage,
            SUM(CASE WHEN a.status = 'present' THEN 1 WHEN a.status = 'half_day' THEN 0.5 ELSE 0 END) AS days_worked,
            SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absent_days
       FROM employees e
       LEFT JOIN attendance a
         ON a.employee_id = e.id AND DATE_FORMAT(a.attendance_date, '%Y-%m') = :wageMonth
      WHERE e.is_active = TRUE
      GROUP BY e.id`
    ,
    { wageMonth }
  );

  const calculated = rows.map((row) => {
    const daysWorked = Number(row.days_worked || 0);
    const absentDays = Number(row.absent_days || 0);
    const baseAmount = row.employee_type === "monthly_salary"
      ? Number(row.monthly_salary || 0)
      : Number(row.daily_wage || 0) * daysWorked;
    const deductionAmount = row.employee_type === "monthly_salary"
      ? (Number(row.monthly_salary || 0) / 30) * absentDays
      : 0;

    return {
      ...row,
      days_worked: daysWorked,
      absent_days: absentDays,
      payable_amount: Math.max(baseAmount - deductionAmount, 0)
    };
  });

  sendJson(res, 200, calculated);
}

module.exports = { calculateWages };
