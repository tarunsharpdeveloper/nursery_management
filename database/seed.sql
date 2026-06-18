USE nursery_management;

INSERT INTO roles (name) VALUES ('super_admin'), ('staff_user'), ('billing_user');

INSERT INTO users (role_id, name, email, password_hash) VALUES
(1, 'Owner Admin', 'owner@nursery.local', 'change-me'),
(2, 'Stock Staff', 'staff@nursery.local', 'change-me'),
(3, 'Billing User', 'billing@nursery.local', 'change-me');

INSERT INTO categories (name, description) VALUES
('Fruit Plants', 'Mango, guava, lemon and seasonal fruit plants'),
('Flower Plants', 'Flowering plants for gardens and farms'),
('Medicinal Plants', 'Herbal and medicinal plants'),
('Ornamental Plants', 'Decorative indoor and outdoor plants'),
('Vegetable Seeds', 'Seeds for vegetable production'),
('Flower Seeds', 'Seeds for flowering plants');

INSERT INTO products (category_id, product_type, name, description, selling_price, available_quantity, photo_url) VALUES
(1, 'plant', 'Alphonso Mango Plant', 'Healthy grafted mango plant ready for farm plantation.', 220.00, 140, 'https://images.unsplash.com/photo-1598512752271-33f913a5af13'),
(2, 'plant', 'Marigold Plant', 'Bright flowering plant suitable for gardens and borders.', 35.00, 520, 'https://images.unsplash.com/photo-1471899236350-e3016bf1e69e'),
(5, 'seed', 'Tomato Seeds', 'High germination tomato seed packet for vegetable growers.', 80.00, 300, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea'),
(4, 'plant', 'Areca Palm', 'Popular ornamental palm for indoor and outdoor use.', 180.00, 95, 'https://images.unsplash.com/photo-1485955900006-10f4d324d411');

INSERT INTO customers (name, phone, email, address, is_credit_customer, credit_limit) VALUES
('Ramesh Farms', '9876543210', 'ramesh@example.com', 'Village Road, Gujarat', TRUE, 50000.00),
('Green City Garden', '9765432109', 'garden@example.com', 'City Market, Gujarat', TRUE, 25000.00),
('Online Customer', '9654321098', NULL, 'Online delivery address', FALSE, 0.00);

INSERT INTO orders (customer_id, order_number, order_source, status, payment_status, total_amount) VALUES
(1, 'ORD-1008', 'online', 'received', 'pending', 12400.00),
(2, 'ORD-1007', 'online', 'approved', 'paid', 8750.00),
(3, 'ORD-1006', 'online', 'dispatch', 'paid', 1680.00);

INSERT INTO payments (order_id, payment_gateway, gateway_payment_id, payment_method, payment_status, amount, paid_at, remarks) VALUES
(2, 'Razorpay', 'pay_demo_1007', 'upi', 'paid', 8750.00, NOW(), 'UPI payment received'),
(3, 'Razorpay', 'pay_demo_1006', 'debit_card', 'paid', 1680.00, NOW(), 'Debit card payment received');

INSERT INTO bills (customer_id, order_id, bill_number, bill_type, payment_type, bill_date, total_amount, paid_amount, balance_amount, created_by) VALUES
(1, 1, 'BILL-501', 'credit_sale', 'credit', CURDATE(), 12400.00, 5000.00, 7400.00, 3),
(2, 2, 'BILL-502', 'cash_sale', 'upi', CURDATE(), 8750.00, 8750.00, 0.00, 3);

INSERT INTO customer_ledger (customer_id, transaction_date, transaction_type, debit_amount, credit_amount, reference_type, reference_id, remarks) VALUES
(1, CURDATE(), 'purchase', 12400.00, 0.00, 'bills', 1, 'Credit sale bill'),
(1, CURDATE(), 'payment', 0.00, 5000.00, 'payments', NULL, 'Partial payment received');

INSERT INTO advance_bookings
(booking_number, customer_id, product_id, quantity, advance_amount, total_bill_amount, balance_payable, booking_date, delivery_date, remarks, status)
VALUES
('AB-1001', 1, 1, 100, 5000.00, 22000.00, 17000.00, CURDATE(), '2026-08-15', 'Future delivery booking for mango plants', 'booked');

INSERT INTO dispatches
(order_id, dispatch_type, dispatch_date, status, bus_number, driver_name, driver_mobile, courier_company, docket_number, remarks)
VALUES
(3, 'bus', CURDATE(), 'dispatched', 'GJ-01-BUS-44', 'Mahesh Driver', '9543210987', NULL, NULL, 'Plants sent through bus'),
(2, 'courier', CURDATE(), 'delivered', NULL, NULL, NULL, 'Blue Dart', 'BD123456', 'Seed parcel delivered');

INSERT INTO employees (name, mobile, gender, joining_date, employee_type, monthly_salary, daily_wage) VALUES
('Suresh Patel', '9432109876', 'male', '2025-01-10', 'monthly_salary', 18000.00, NULL),
('Meena Ben', '9321098765', 'female', '2025-03-15', 'daily_wage', NULL, 400.00),
('Raju Kumar', '9210987654', 'male', '2025-05-20', 'daily_wage', NULL, 500.00);

INSERT INTO gender_wage_rates (gender, daily_rate, effective_from) VALUES
('male', 500.00, '2026-01-01'),
('female', 400.00, '2026-01-01'),
('other', 450.00, '2026-01-01');
