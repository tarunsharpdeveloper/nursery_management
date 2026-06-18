const { z } = require("zod");
const { pool } = require("../db");

const employeeSchema = z.object({
  name: z.string().min(2),
  mobile: z.string().min(8),
  gender: z.enum(["male", "female", "other"]),
  joiningDate: z.string().min(10),
  employeeType: z.enum(["monthly_salary", "daily_wage"]),
  monthlySalary: z.number().min(0).optional(),
  dailyWage: z.number().min(0).optional()
});

const attendanceSchema = z.object({
  employeeId: z.number().int().positive(),
  attendanceDate: z.string().min(10),
  status: z.enum(["present", "absent", "half_day", "leave"]),
  remarks: z.string().optional()
});

async function createEmployee(req, res, { readJson, sendJson }) {
  const payload = employeeSchema.parse(await readJson(req));
  const [result] = await pool.query(
    `INSERT INTO employees
      (name, mobile, gender, joining_date, employee_type, monthly_salary, daily_wage)
     VALUES (:name, :mobile, :gender, :joiningDate, :employeeType, :monthlySalary, :dailyWage)`,
    {
      ...payload,
      monthlySalary: payload.monthlySalary || null,
      dailyWage: payload.dailyWage || null
    }
  );

  sendJson(res, 201, { employeeId: Number(result.insertId) });
}

async function saveAttendance(req, res, { readJson, sendJson }) {
  const payload = attendanceSchema.parse(await readJson(req));
  await pool.query(
    `INSERT INTO attendance (employee_id, attendance_date, status, remarks)
     VALUES (:employeeId, :attendanceDate, :status, :remarks)
     ON DUPLICATE KEY UPDATE status = VALUES(status), remarks = VALUES(remarks)`,
    { ...payload, remarks: payload.remarks || null }
  );

  sendJson(res, 201, { saved: true });
}

module.exports = { createEmployee, saveAttendance };
