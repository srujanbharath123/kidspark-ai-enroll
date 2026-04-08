
-- Delete duplicate OTP-created user that conflicts with admin phone
DELETE FROM user_roles WHERE user_id = '7690831c-46b9-4fb3-a12e-105b8d6158a6';
DELETE FROM profiles WHERE user_id = '7690831c-46b9-4fb3-a12e-105b8d6158a6';
