-- New table for storing multiple products in an advance booking
CREATE TABLE `advance_booking_items` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `booking_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `variant_id` INT DEFAULT NULL,
  `quantity` INT NOT NULL,
  `unit_price` DECIMAL(10,2) NOT NULL,
  `line_total` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `booking_id` (`booking_id`),
  KEY `product_id` (`product_id`),
  KEY `variant_id` (`variant_id`),
  CONSTRAINT `advance_booking_items_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `advance_bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `advance_booking_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `advance_booking_items_ibfk_3` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: After creating this table, the existing 'product_id', 'variant_id', and 'quantity' 
-- fields in 'advance_bookings' table can be removed in future, but keeping them for 
-- backward compatibility with existing data.
