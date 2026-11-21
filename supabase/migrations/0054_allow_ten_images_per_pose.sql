-- Up to 10 images per pose (was 5); the form caps it with MAX_IMAGES in form-image.ts.
alter table public.pose_images drop constraint pose_images_position_check;
alter table public.pose_images
  add constraint pose_images_position_check check (position between 0 and 9);
