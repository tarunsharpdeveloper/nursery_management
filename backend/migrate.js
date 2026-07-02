const { pool } = require("./db");
const { hashPassword } = require("./auth");

async function columnExists(tableName, columnName) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = :tableName
        AND COLUMN_NAME = :columnName`,
    { tableName, columnName }
  );

  return Number(rows[0].total) > 0;
}

async function addColumn(tableName, columnName, definition) {
  if (!(await columnExists(tableName, columnName))) {
    await pool.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

async function modifyColumnEnum(tableName, columnName, newDefinition) {
  try {
    await pool.query(`ALTER TABLE ${tableName} MODIFY ${columnName} ${newDefinition}`);
  } catch (e) {
    console.error(`Error modifying column ${columnName} on ${tableName}:`, e.message);
  }
}

async function ensureAdminSchema() {
  await modifyColumnEnum("stock_ledger", "movement_type", "ENUM('production', 'sale', 'online_order', 'advance_booking', 'adjustment') NOT NULL");
  await pool.query("INSERT IGNORE INTO roles (name) VALUES ('super_admin'), ('staff_user'), ('billing_user'), ('customer')");
  await addColumn("roles", "permissions", "JSON NULL");
  await addColumn("users", "role", "VARCHAR(50) NULL");
  await pool.query("ALTER TABLE users MODIFY role VARCHAR(50) NULL");

  const defaultUsers = [
    { role: "super_admin", name: "Owner Admin", email: "owner@nursery.local", password: "owner123" },
    { role: "staff_user", name: "Stock Staff", email: "staff@nursery.local", password: "staff123" },
    { role: "billing_user", name: "Billing User", email: "billing@nursery.local", password: "billing123" }
  ];

  for (const user of defaultUsers) {
    const [roles] = await pool.query("SELECT id FROM roles WHERE name = :role", { role: user.role });
    const roleId = roles[0].id;
    const passwordHash = hashPassword(user.password);
    await pool.query(
      `INSERT INTO users (role_id, role, name, email, password_hash)
       VALUES (:roleId, :role, :name, :email, :passwordHash)
       ON DUPLICATE KEY UPDATE
         role_id = VALUES(role_id),
         role = VALUES(role),
         name = VALUES(name),
         password_hash = IF(password_hash = 'change-me', VALUES(password_hash), password_hash),
         is_active = TRUE`,
      { roleId, role: user.role, name: user.name, email: user.email, passwordHash }
    );
  }

  await pool.query(`
    UPDATE users u
    JOIN roles r ON r.id = u.role_id
       SET u.role = r.name
     WHERE u.role IS NULL
  `);
  await pool.query("ALTER TABLE users MODIFY role VARCHAR(50) NOT NULL");
  
  const rolePermissions = {
    super_admin: ["*"],
    staff_user: [
      "dashboard:read", "products:read", "products:write", "inventory:read",
      "production:write", "orders:read", "orders:write", "attendance:read",
      "attendance:write", "employees:read"
    ],
    billing_user: [
      "dashboard:read", "orders:read", "payments:read", "payments:write",
      "billing:read", "billing:write", "ledger:read"
    ],
    customer: []
  };

  for (const [roleName, perms] of Object.entries(rolePermissions)) {
    await pool.query(
      "UPDATE roles SET permissions = COALESCE(permissions, :perms) WHERE name = :roleName",
      { perms: JSON.stringify(perms), roleName }
    );
  }

  await addColumn("users", "is_deleted", "TINYINT(1) NOT NULL DEFAULT 0");
  await addColumn("roles", "is_deleted", "TINYINT(1) NOT NULL DEFAULT 0");

  await addColumn("customers", "is_credit_customer", "BOOLEAN NOT NULL DEFAULT FALSE");
  await addColumn("customers", "credit_limit", "DECIMAL(10,2) NOT NULL DEFAULT 0");
  await addColumn("categories", "parent_id", "INT NULL");
  await addColumn("categories", "category_type", "ENUM('plant', 'seed') NULL");
  await addColumn("categories", "photo_urls", "TEXT NULL");

  await addColumn("products", "actual_price", "DECIMAL(10,2) NOT NULL DEFAULT 0");
  await addColumn("products", "unit", "ENUM('Piece', 'Packet', 'Kg', 'Gram', 'ml', 'litre', 'bag', 'bundle') NULL");
  await addColumn("products", "media_urls", "LONGTEXT NULL");
  await addColumn("products", "updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
  await addColumn("products", "is_deleted", "TINYINT(1) NOT NULL DEFAULT 0");

  await pool.query("UPDATE orders SET payment_status = 'pending' WHERE payment_status = 'partial'");
  await pool.query("ALTER TABLE orders MODIFY payment_status ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending'");
  await addColumn("orders", "is_deleted", "TINYINT(1) NOT NULL DEFAULT 0");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS product_variants (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      unit VARCHAR(50),
      unit_value VARCHAR(50),
      actual_price DECIMAL(10,2) NOT NULL DEFAULT 0,
      selling_price DECIMAL(10,2) NOT NULL DEFAULT 0,
      available_quantity INT NOT NULL DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS production_entries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      category_id INT NULL,
      sub_category_id INT NULL,
      sub_sub_category_id INT NULL,
      production_type ENUM('plant', 'seed') NOT NULL,
      production_date DATE NOT NULL,
      quantity_produced INT NOT NULL,
      remarks TEXT,
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (sub_category_id) REFERENCES categories(id),
      FOREIGN KEY (sub_sub_category_id) REFERENCES categories(id)
    )
  `);

  await addColumn("production_entries", "category_id", "INT NULL");
  await addColumn("production_entries", "sub_category_id", "INT NULL");
  await addColumn("production_entries", "sub_sub_category_id", "INT NULL");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS employees (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      mobile VARCHAR(30) NOT NULL,
      gender ENUM('male', 'female', 'other') NOT NULL,
      joining_date DATE NOT NULL,
      employee_type ENUM('monthly_salary', 'daily_wage') NOT NULL,
      monthly_salary DECIMAL(10,2),
      daily_wage DECIMAL(10,2),
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS gender_wage_rates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      gender ENUM('male', 'female', 'other') NOT NULL UNIQUE,
      daily_rate DECIMAL(10,2) NOT NULL,
      effective_from DATE NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT,
      bill_id INT,
      payment_gateway VARCHAR(120),
      gateway_payment_id VARCHAR(160),
      payment_method ENUM('upi', 'credit_card', 'debit_card', 'net_banking', 'cash', 'credit') NOT NULL,
      payment_status ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
      amount DECIMAL(10,2) NOT NULL,
      paid_at DATETIME,
      remarks TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await addColumn("bills", "customer_id", "INT NULL");
  await addColumn("bills", "payment_type", "ENUM('cash', 'upi', 'credit') NOT NULL DEFAULT 'cash'");
  await addColumn("bills", "is_deleted", "TINYINT(1) NOT NULL DEFAULT 0");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bill_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bill_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      line_total DECIMAL(10,2) NOT NULL
    )
  `);

  await addColumn("order_items", "variant_id", "INT NULL");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS customer_ledger (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      transaction_date DATE NOT NULL,
      transaction_type ENUM('purchase', 'payment', 'advance', 'adjustment') NOT NULL,
      debit_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      credit_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      reference_type VARCHAR(60),
      reference_id INT,
      remarks TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await addColumn("advance_bookings", "booking_number", "VARCHAR(40) NULL");
  await addColumn("advance_bookings", "variant_id", "INT NULL");
  await addColumn("advance_bookings", "total_bill_amount", "DECIMAL(10,2) NOT NULL DEFAULT 0");
  await addColumn("advance_bookings", "balance_payable", "DECIMAL(10,2) NOT NULL DEFAULT 0");
  await addColumn("advance_bookings", "delivery_date", "DATE NULL");
  await addColumn("advance_bookings", "remarks", "TEXT");
  await addColumn("advance_bookings", "final_bill_id", "INT NULL");

  await addColumn("dispatches", "dispatch_type", "ENUM('bus', 'courier') NULL");
  await addColumn("dispatches", "bus_number", "VARCHAR(80)");
  await addColumn("dispatches", "driver_name", "VARCHAR(120)");
  await addColumn("dispatches", "driver_mobile", "VARCHAR(30)");
  await addColumn("dispatches", "bus_photo_url", "VARCHAR(500)");
  await addColumn("dispatches", "courier_company", "VARCHAR(120)");
  await addColumn("dispatches", "docket_number", "VARCHAR(120)");
  await addColumn("dispatches", "advance_booking_id", "INT NULL");
  await pool.query("ALTER TABLE dispatches MODIFY order_id INT NULL");

  if (await columnExists("attendance", "user_id")) {
    await pool.query("ALTER TABLE attendance MODIFY user_id INT NULL");
  }
  await addColumn("attendance", "employee_id", "INT NULL");
  await pool.query("ALTER TABLE attendance MODIFY status ENUM('present', 'absent', 'half_day', 'leave', 'sunday_off') NOT NULL");
  
  await addColumn("employees", "is_deleted", "TINYINT(1) NOT NULL DEFAULT 0");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS wage_calculations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      wage_month CHAR(7) NOT NULL,
      present_days DECIMAL(5,2) NOT NULL DEFAULT 0,
      leave_days DECIMAL(5,2) NOT NULL DEFAULT 0,
      absent_days DECIMAL(5,2) NOT NULL DEFAULT 0,
      base_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      deduction_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      payable_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

module.exports = { ensureAdminSchema };
