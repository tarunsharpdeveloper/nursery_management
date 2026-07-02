import { AdminModule } from "@/components/admin-module";

export default function EmployeesPage() {
  return (
    <>
      <AdminModule
        eyebrow="Employee Master"
        title="Monthly Salary and Daily Wage Employees"
        listPath="/api/admin/data-list?model=employees"
        searchPlaceholder="Search name, mobile..."
        filterConfig={{
          key: "employee_type",
          label: "Employee Type",
          options: [
            { value: "monthly_salary", label: "Monthly Salary" },
            { value: "daily_wage", label: "Daily Wage" }
          ]
        }}
        submitPath="/api/employees"
        submitLabel="Save Employee"
        fields={[
          { name: "name", label: "Employee Name" },
          { name: "mobile", label: "Mobile" },
          { name: "gender", label: "Gender", type: "select", options: [{ label: "Male", value: "male" }, { label: "Female", value: "female" }, { label: "Other", value: "other" }] },
          { name: "joiningDate", label: "Joining Date", type: "date" },
          { name: "employeeType", label: "Employee Type", type: "select", options: [{ label: "Monthly Salary", value: "monthly_salary" }, { label: "Daily Wage", value: "daily_wage" }] },
          { name: "monthlySalary", label: "Monthly Salary", type: "number", valueType: "number" },
          { name: "dailyWage", label: "Daily Wage", type: "number", valueType: "number" }
        ]}
        columns={[
          { key: "id", label: "ID" },
          { key: "name", label: "Employee" },
          { key: "mobile", label: "Mobile" },
          { key: "gender", label: "Gender" },
          { key: "employee_type", label: "Type" },
          { key: "monthly_salary", label: "Salary" },
          { key: "daily_wage", label: "Wage" }
        ]}
      />
    </>
  );
}
