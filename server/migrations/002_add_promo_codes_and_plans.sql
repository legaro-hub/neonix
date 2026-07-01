-- Add plan and planExpiresAt to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;

-- PromoCode table
CREATE TABLE IF NOT EXISTS promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    plan VARCHAR(20) DEFAULT 'pro',
    days_count INT DEFAULT 7,
    max_uses INT,
    current_uses INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ
);

-- PromoCodeUsage table
CREATE TABLE IF NOT EXISTS promo_code_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    used_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(promo_code_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_pcu_user ON promo_code_usages(user_id);

-- Insert some default promo codes
INSERT INTO promo_codes (code, description, plan, days_count, max_uses) VALUES
('NEONIX2026', 'Приветственный промокод — 7 дней Pro бесплатно', 'pro', 7, NULL),
('FRIEND', 'Промокод от друга — 14 дней Pro', 'pro', 14, NULL),
('LAUNCH', 'Запуск сервиса — 30 дней Pro', 'pro', 30, 100),
('FREEDAYS', 'Бесплатные дни — 3 дня Pro', 'pro', 3, NULL)
ON CONFLICT (code) DO NOTHING;
