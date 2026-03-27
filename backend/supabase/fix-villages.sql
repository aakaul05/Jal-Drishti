-- ============================================================
--  FIX VILLAGES - MATCH ACTUAL SUB-DISTRICT CODES
-- ============================================================

-- Clear existing villages
DELETE FROM mh_villages;

-- Insert villages with CORRECT sub-district codes
INSERT INTO mh_villages (village_code, village_name, subdistrict_code, district_code) VALUES
-- Pune - Ambegaon (2601)
(2601001, 'Ambegaon', 2601, 490),
(2601002, 'Avasari', 2601, 490),
(2601003, 'Bhimashankar', 2601, 490),
(2601004, 'Ghod', 2601, 490),
(2601005, 'Junnar', 2601, 490),

-- Pune - Baramati (2602)
(2602001, 'Baramati', 2602, 490),
(2602002, 'Jejuri', 2602, 490),
(2602003, 'Supa', 2602, 490),
(2602004, 'Nimbodi', 2602, 490),
(2602005, 'Kasarwadi', 2602, 490),

-- Pune - Haveli (2605)
(2605001, 'Hadapsar', 2605, 490),
(2605002, 'Magarpatta', 2605, 490),
(2605003, 'Phursungi', 2605, 490),
(2605004, 'Loni Kalbhor', 2605, 490),
(2605005, 'Uruli Kanchan', 2605, 490),

-- Nashik - Baglan (2301)
(2301001, 'Satana', 2301, 487),
(2301002, 'Baglan', 2301, 487),
(2301003, 'Waghai', 2301, 487),
(2301004, 'Kalwan', 2301, 487),
(2301005, 'Pimpalner', 2301, 487),

-- Nashik - Chandvad (2302)
(2302001, 'Chandvad', 2302, 487),
(2302002, 'Manmad', 2302, 487),
(2302003, 'Yeola', 2302, 487),
(2302004, 'Nandgaon', 2302, 487),
(2302005, 'Lasalgaon', 2302, 487);

-- Verification
SELECT 
    (SELECT COUNT(*) FROM mh_villages) as villages_count,
    (SELECT COUNT(*) FROM mh_districts) as districts_count,
    (SELECT COUNT(*) FROM mh_subdistricts) as subdistricts_count;
