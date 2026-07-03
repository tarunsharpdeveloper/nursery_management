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
  status: z.enum(["present", "absent", "half_day", "leave", "sunday_off"]),
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

const bulkAttendanceSchema = z.object({
  records: z.array(attendanceSchema)
});

async function saveBulkAttendance(req, res, { readJson, sendJson }) {
  const payload = bulkAttendanceSchema.parse(await readJson(req));
  
  if (payload.records.length === 0) {
    return sendJson(res, 200, { saved: true });
  }

  const values = [];
  const queryParams = [];
  
  payload.records.forEach(record => {
    values.push("(?, ?, ?, ?)");
    queryParams.push(record.employeeId, record.attendanceDate, record.status, record.remarks || null);
  });

  const query = `
    INSERT INTO attendance (employee_id, attendance_date, status, remarks)
    VALUES ${values.join(", ")}
    ON DUPLICATE KEY UPDATE status = VALUES(status), remarks = VALUES(remarks)
  `;

  await pool.query(query, queryParams);
  sendJson(res, 201, { saved: true, count: payload.records.length });
}

const editEmployeeSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(2),
  mobile: z.string().min(8),
  gender: z.enum(["male", "female", "other"]),
  joiningDate: z.string().min(10),
  employeeType: z.enum(["monthly_salary", "daily_wage"]),
  monthlySalary: z.number().min(0).optional(),
  dailyWage: z.number().min(0).optional()
});

async function editEmployee(req, res, { readJson, sendJson }) {
  const payload = editEmployeeSchema.parse(await readJson(req));
  await pool.query(
    `UPDATE employees
        SET name = :name,
            mobile = :mobile,
            gender = :gender,
            joining_date = :joiningDate,
            employee_type = :employeeType,
            monthly_salary = :monthlySalary,
            daily_wage = :dailyWage
      WHERE id = :id`,
    {
      ...payload,
      monthlySalary: payload.monthlySalary || null,
      dailyWage: payload.dailyWage || null
    }
  );

  sendJson(res, 200, { updated: true });
}

const toggleEmployeeSchema = z.object({
  employeeId: z.number().int().positive(),
  isActive: z.boolean()
});

async function toggleEmployee(req, res, { readJson, sendJson }) {
  const payload = toggleEmployeeSchema.parse(await readJson(req));
  await pool.query(
    "UPDATE employees SET is_active = :isActive WHERE id = :employeeId",
    payload
  );
  sendJson(res, 200, { updated: true });
}

const deleteEmployeeSchema = z.object({
  employeeId: z.number().int().positive()
});

async function deleteEmployee(req, res, { readJson, sendJson }) {
  const payload = deleteEmployeeSchema.parse(await readJson(req));
  
  await pool.query(
    "UPDATE employees SET is_deleted = 1 WHERE id = :employeeId",
    payload
  );
  sendJson(res, 200, { deleted: true });
}

module.exports = { createEmployee, saveAttendance, saveBulkAttendance, editEmployee, toggleEmployee, deleteEmployee };
