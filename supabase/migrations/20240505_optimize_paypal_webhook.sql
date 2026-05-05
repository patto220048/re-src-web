-- Hàm Postgres tối ưu hóa xử lý Webhook PayPal
-- Tác vụ: Gộp 2 lệnh SELECT và 2 lệnh UPDATE vào 1 Transaction duy nhất.
-- Tiết kiệm: 3 round-trips tới database và giảm thời gian thực thi Edge Function.

CREATE OR REPLACE FUNCTION handle_paypal_subscription_update(
  p_subscription_id TEXT,
  p_event_type TEXT,
  p_status TEXT,
  p_next_billing_time TEXT DEFAULT NULL
)
RETURNS TABLE (
  user_email TEXT,
  old_auto_renew BOOLEAN,
  old_status TEXT,
  final_status TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER -- Chạy với quyền admin để có thể update profiles/subscriptions
AS $$
DECLARE
  v_new_status TEXT := p_status;
  v_old_auto_renew BOOLEAN;
  v_old_status TEXT;
  v_user_email TEXT;
  v_next_billing_timestamp TIMESTAMPTZ;
BEGIN
  -- 1. Lấy thông tin subscription hiện tại
  SELECT auto_renew, status INTO v_old_auto_renew, v_old_status
  FROM subscriptions
  WHERE paypal_subscription_id = p_subscription_id;

  -- 2. Xử lý logic gia hạn (Nếu đã tắt auto_renew mà PayPal vẫn gửi RENEWED thì giữ là CANCELLED)
  IF p_event_type = 'BILLING.SUBSCRIPTION.RENEWED' AND v_old_auto_renew = false THEN
    v_new_status := 'CANCELLED';
  END IF;

  -- 3. Chuyển đổi format thời gian
  IF p_next_billing_time IS NOT NULL THEN
    v_next_billing_timestamp := p_next_billing_time::TIMESTAMPTZ;
  END IF;

  -- 4. Cập nhật bảng Subscriptions
  UPDATE subscriptions
  SET 
    status = v_new_status,
    updated_at = now(),
    current_period_end = COALESCE(v_next_billing_timestamp, current_period_end)
  WHERE paypal_subscription_id = p_subscription_id;

  -- 5. Cập nhật bảng Profiles và lấy Email người dùng về để gửi thông báo
  -- Chúng ta dùng RETURNING để lấy email ngay sau khi update, tiết kiệm 1 lệnh SELECT
  UPDATE profiles
  SET
    subscription_status = lower(v_new_status),
    subscription_expires_at = COALESCE(v_next_billing_timestamp, subscription_expires_at)
  WHERE subscription_id = p_subscription_id
  RETURNING email INTO v_user_email;

  -- 6. Trả kết quả về cho Edge Function
  RETURN QUERY SELECT v_user_email, v_old_auto_renew, v_old_status, v_new_status;
END;
$$;
