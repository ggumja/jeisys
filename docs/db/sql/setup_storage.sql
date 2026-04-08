-- Create a storage bucket for business certificates
INSERT INTO storage.buckets (id, name, public) VALUES ('business-certificates', 'business-certificates', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload their own certificates
-- Actually, during signup, the user is created in auth.users, but might not be fully logged in session-wise in some flows,
-- but authService uses the client which holds the session after signUp (if auto-confirm is on).
-- If email confirm is off (as per previous step), they are logged in.

-- Allow public access to read (or restrict to auth users)
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'business-certificates' );

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'business-certificates' 
    AND auth.role() = 'authenticated'
);

-- Allow users to update/delete their own files (optional)
CREATE POLICY "Users can update own files" ON storage.objects FOR UPDATE USING (
    bucket_id = 'business-certificates' 
    AND owner = auth.uid()
);
