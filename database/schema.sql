CREATE DATABASE IF NOT EXISTS nursery_management;
USE nursery_management;

CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  role ENUM('super_admin', 'staff_user', 'billing_user', 'customer') NOT NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  email VARCHAR(160),
  address TEXT,
  is_credit_customer BOOLEAN NOT NULL DEFAULT FALSE,
  credit_limit DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  parent_id INT NULL,
  UNIQUE KEY unique_category_name_parent (name, parent_id),
  FOREIGN KEY (parent_id) REFERENCES categories(id)
);

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  product_type ENUM('plant', 'seed') NOT NULL,
  name VARCHAR(160) NOT NULL,
  description TEXT,
  selling_price DECIMAL(10,2) NOT NULL,
  available_quantity INT NOT NULL DEFAULT 0,
  photo_url VARCHAR(500),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE stock_ledger (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  movement_type ENUM('production', 'sale', 'online_order', 'manual_adjustment', 'stock_adjustment', 'advance_booking_delivery') NOT NULL,
  quantity_change INT NOT NULL,
  reference_type VARCHAR(60),
  reference_id INT,
  remarks TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE production_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  production_type ENUM('plant', 'seed') NOT NULL,
  production_date DATE NOT NULL,
  quantity_produced INT NOT NULL,
  remarks TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  order_number VARCHAR(40) NOT NULL UNIQUE,
  order_source ENUM('online', 'offline') NOT NULL DEFAULT 'online',
  status ENUM('received', 'approved', 'dispatch', 'delivered', 'cancelled') NOT NULL DEFAULT 'received',
  payment_status ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE payments (
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE bills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  order_id INT,
  bill_number VARCHAR(40) NOT NULL UNIQUE,
  bill_type ENUM('cash_sale', 'credit_sale') NOT NULL,
  payment_type ENUM('cash', 'upi', 'credit') NOT NULL,
  bill_date DATE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  balance_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

ALTER TABLE payments
  ADD CONSTRAINT fk_payments_bill FOREIGN KEY (bill_id) REFERENCES bills(id);

CREATE TABLE bill_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bill_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (bill_id) REFERENCES bills(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE customer_ledger (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  transaction_date DATE NOT NULL,
  transaction_type ENUM('purchase', 'payment', 'advance', 'adjustment') NOT NULL,
  debit_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  credit_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  reference_type VARCHAR(60),
  reference_id INT,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE advance_bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_number VARCHAR(40) NOT NULL UNIQUE,
  customer_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  advance_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_bill_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  balance_payable DECIMAL(10,2) NOT NULL DEFAULT 0,
  booking_date DATE NOT NULL,
  delivery_date DATE NOT NULL,
  remarks TEXT,
  status ENUM('booked', 'ready', 'delivered', 'cancelled') NOT NULL DEFAULT 'booked',
  final_bill_id INT,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (final_bill_id) REFERENCES bills(id)
);

CREATE TABLE dispatches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT,
  dispatch_type ENUM('bus', 'courier') NOT NULL,
  dispatch_date DATE NOT NULL,
  status ENUM('pending', 'dispatched', 'delivered') NOT NULL DEFAULT 'pending',
  bus_number VARCHAR(80),
  driver_name VARCHAR(120),
  driver_mobile VARCHAR(30),
  bus_photo_url VARCHAR(500),
  courier_company VARCHAR(120),
  docket_number VARCHAR(120),
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE employees (
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
);

CREATE TABLE gender_wage_rates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  gender ENUM('male', 'female', 'other') NOT NULL UNIQUE,
  daily_rate DECIMAL(10,2) NOT NULL,
  effective_from DATE NOT NULL
);

CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  attendance_date DATE NOT NULL,
  status ENUM('present', 'absent', 'half_day', 'leave') NOT NULL,
  remarks TEXT,
  UNIQUE KEY unique_employee_day (employee_id, attendance_date),
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE wage_calculations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  wage_month CHAR(7) NOT NULL,
  present_days DECIMAL(5,2) NOT NULL DEFAULT 0,
  leave_days DECIMAL(5,2) NOT NULL DEFAULT 0,
  absent_days DECIMAL(5,2) NOT NULL DEFAULT 0,
  base_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  deduction_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payable_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_employee_month (employee_id, wage_month),
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);
