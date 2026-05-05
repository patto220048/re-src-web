-- =========================================================
-- PHÁP 2: TỐI ƯU HÓA HIỆU NĂNG VÀ GIỚI HẠN TẢI XUỐNG
-- =========================================================

-- 1. THÊM INDEX CHO BẢNG RESOURCES (TỐI ƯU TỐC ĐỘ)
-- Giúp tìm kiếm theo slug nhanh hơn (trang chi tiết)
CREATE INDEX IF NOT EXISTS idx_resources_slug ON public.resources(slug);

-- Giúp lọc theo thư mục và danh mục nhanh hơn (trang grid)
CREATE INDEX IF NOT EXISTS idx_resources_folder_id ON public.resources(folder_id);
CREATE INDEX IF NOT EXISTS idx_resources_category_id ON public.resources(category_id);

-- Giúp tìm kiếm theo Tags cực nhanh (sử dụng GIN index cho mảng tags)
CREATE INDEX IF NOT EXISTS idx_resources_tags ON public.resources USING GIN (tags);


-- 2. CẬP NHẬT BẢNG PROFILES (QUẢN LÝ LƯỢT TẢI)
-- Thêm cột để theo dõi số lượt tải trong ngày
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS daily_download_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_download_date DATE DEFAULT CURRENT_DATE;

-- Chú thích cho các cột mới
COMMENT ON COLUMN public.profiles.daily_download_count IS 'Số lượt tải tài nguyên trong ngày hiện tại';
COMMENT ON COLUMN public.profiles.last_download_date IS 'Ngày thực hiện lượt tải cuối cùng (dùng để reset bộ đếm)';
