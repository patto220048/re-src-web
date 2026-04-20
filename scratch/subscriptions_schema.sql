-- Bảng Settings Hệ Thống để quản lý PayPal Environment & Keys
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- RLS (Tuỳ chỉnh theo rule của project, mặc định cho phép đọc công khai để Frontend lấy Settings nhanh chóng)
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cho phép đọc công khai system_settings"
ON public.system_settings FOR SELECT
USING (true);

-- Cho phép Admin chỉnh sửa (Giả sử bạn có Role hoặc dựa trên Email)
-- CREATE POLICY "Admin sửa settings" ON public.system_settings FOR ALL USING (auth.jwt()->>'email' = 'admin_email@example.com');

-- Dữ liệu hạt giống cho PayPal Settings
INSERT INTO public.system_settings (setting_key, setting_value)
VALUES 
    ('paypal_config', '{
        "env": "sandbox",
        "sandbox": {
            "client_id": "test_client_id_here",
            "monthly_plan_id": "P-MONTHLY-SANDBOX",
            "monthly_price": 2,
            "yearly_plan_id": "P-YEARLY-SANDBOX",
            "yearly_price": 18
        },
        "live": {
            "client_id": "live_client_id_here",
            "monthly_plan_id": "P-MONTHLY-LIVE",
            "monthly_price": 2,
            "yearly_plan_id": "P-YEARLY-LIVE",
            "yearly_price": 18
        }
    }'::jsonb)
ON CONFLICT (setting_key) 
DO UPDATE SET setting_value = EXCLUDED.setting_value;


-- Bảng lưu trữ Subscriptions của người dùng
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    paypal_subscription_id TEXT UNIQUE NOT NULL,
    plan_id TEXT NOT NULL,
    status TEXT NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    auto_renew BOOLEAN DEFAULT true
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- User chỉ xem subscription của mình
CREATE POLICY "View own subscriptions"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Dữ liệu này được tạo từ backend an toàn, nên tuỳ thuộc vào cách backend insert bằng service_role hay gì đó.
