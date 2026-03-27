-- ============================================================
--  POPULATE SAMPLE VILLAGES
-- ============================================================

-- Clear existing villages (if any)
DELETE FROM mh_villages;

-- Insert sample villages for Pune sub-districts
INSERT INTO mh_villages (village_code, village_name, subdistrict_code, district_code) VALUES
-- Pune City sub-district (4191)
(4191001, 'Pune City', 4191, 490),
(4191002, 'Koregaon Park', 4191, 490),
(4191003, 'Kalyani Nagar', 4191, 490),
(4191004, 'Camp', 4191, 490),
(4191005, 'Shivajinagar', 4191, 490),

-- Haveli sub-district (4193)
(4193001, 'Hadapsar', 4193, 490),
(4193002, 'Magarpatta', 4193, 490),
(4193003, 'Phursungi', 4193, 490),
(4193004, 'Loni Kalbhor', 4193, 490),
(4193005, 'Uruli Kanchan', 4193, 490),

-- Baramati sub-district (4199)
(4199001, 'Baramati', 4199, 490),
(4199002, 'Jejuri', 4199, 490),
(4199003, 'Supa', 4199, 490),
(4199004, 'Nimbodi', 4199, 490),
(4199005, 'Kasarwadi', 4199, 490),

-- Nashik - Baglan sub-district (4145)
(4145001, 'Satana', 4145, 487),
(4145002, 'Baglan', 4145, 487),
(4145003, 'Waghai', 4145, 487),
(4145004, 'Kalwan', 4145, 487),
(4145005, 'Pimpalner', 4145, 487),

-- Nashik - Nandgaon sub-district (4147)
(4147001, 'Nandgaon', 4147, 487),
(4147002, 'Manmad', 4147, 487),
(4147003, 'Yeola', 4147, 487),
(4147004, 'Chandvad', 4147, 487),
(4147005, 'Lasalgaon', 4147, 487);

-- Verification
SELECT 
    (SELECT COUNT(*) FROM mh_villages) as villages_count,
    (SELECT COUNT(*) FROM mh_districts) as districts_count,
    (SELECT COUNT(*) FROM mh_subdistricts) as subdistricts_count;
