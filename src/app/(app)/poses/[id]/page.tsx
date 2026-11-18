import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink, MapPin } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { PoseDetailBottomBar, PoseDetailTopBar } from '@/components/pose/pose-detail-actions';
import { PoseImageCarousel, type CarouselImage } from '@/components/pose/pose-image-carousel';
import { inviteSlots, PoseMissingSpecsInvite } from '@/components/pose/pose-missing-specs-invite';
import { PoseSpecCard } from '@/components/pose/pose-spec-card';
import { PoseStepList } from '@/components/pose/pose-step-list';
import { parsePoseGrid } from '@/lib/poses/grid-position';
import { isMissingSpecs, specGaps } from '@/lib/poses/missing-specs';
import { relativeTimeVi } from '@/lib/poses/relative-time';
import { signPaths } from '@/lib/poses/signed-urls';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { requireMember } from '@/lib/supabase/session';
import type { CameraHeight, CameraTilt, Orientation, PoseStatus, Zoom } from '@/lib/types/pose';
import { sceneLabel } from '@/lib/types/pose-labels';

export const metadata: Metadata = { title: 'Chi tiết dáng' };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function Gone() {
  return (
    <EmptyState
      illustration="🫥"
      title="Dáng này không còn nữa"
      description="Có thể dáng đã bị xoá hoặc link bị sai."
      action={
        <Link href="/" className="inline-flex h-12 items-center rounded-full bg-primary px-6 font-semibold text-on-primary">
          Về thư viện
        </Link>
      }
    />
  );
}

/** Host of the source link for the credit line; null when the URL is not parseable. */
function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

export default async function PoseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return <Gone />;

  const viewer = await requireMember();
  const supabase = await createSupabaseServerClient();
  const { data: pose, error } = await supabase
    .from('poses')
    .select(
      '*, pose_images(id,position,full_path,thumb_path,width,height,dominant_color), place:places(id,name), author:profiles!poses_created_by_fkey(display_name,avatar_emoji,avatar_color), fav:favorites(user_id)',
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('pose detail: load failed', error);
    return (
      <EmptyState illustration="📡" title="Chưa tải được dáng này" description="Bạn tải lại trang giúp mình nhé." />
    );
  }
  if (!pose) return <Gone />;

  const images = [...pose.pose_images].sort((a, b) => a.position - b.position);
  let urls = new Map<string, string>();
  try {
    urls = await signPaths(supabase, images.map((image) => image.full_path));
  } catch (signError) {
    console.error('pose detail: signing failed', signError);
  }
  const slides: CarouselImage[] = images.map((image) => ({
    id: image.id,
    url: urls.get(image.full_path) ?? null,
    width: image.width,
    height: image.height,
    color: image.dominant_color,
  }));
  const storagePaths = images.flatMap((image) => [image.full_path, image.thumb_path]);
  const isFavorite = pose.fav.length > 0;
  const sourceHost = pose.source_url ? hostOf(pose.source_url) : null;
  const missingSpecs = { status: pose.status as PoseStatus, cameraHeight: pose.camera_height, stepCount: pose.model_steps.length };
  const invites = isMissingSpecs(missingSpecs) ? inviteSlots(specGaps(missingSpecs)) : { atSpec: null, atSteps: null };

  return (
    <div className="-mx-4 -mt-4 md:mx-auto md:mt-0 md:max-w-[640px] lg:grid lg:max-w-none lg:grid-cols-2 lg:gap-8">
      <div className="relative lg:sticky lg:top-16 lg:self-start">
        <PoseImageCarousel images={slides} title={pose.title} grid={parsePoseGrid(pose.grid)} />
        <PoseDetailTopBar
          poseId={pose.id}
          title={pose.title}
          isFavorite={isFavorite}
          canDelete={pose.created_by === viewer.id || viewer.role === 'admin'}
          storagePaths={storagePaths}
        />
      </div>

      <div className="flex flex-col gap-5 px-4 pt-4 pb-24 md:px-0">
        <header className="flex flex-col gap-2">
          <h1 className="font-display text-[26px] leading-8 font-bold">{pose.title}</h1>
          {pose.status === 'draft' ? (
            <span className="w-fit rounded-full bg-ai-soft px-2.5 py-0.5 text-[13px] font-semibold text-ai">Nháp</span>
          ) : null}
          {pose.author ? (
            <p className="flex items-center gap-2 text-sm text-text-2">
              <Avatar emoji={pose.author.avatar_emoji} color={pose.author.avatar_color} name={pose.author.display_name} size="sm" />
              {pose.author.display_name} · {relativeTimeVi(pose.created_at)}
            </p>
          ) : null}
          {pose.description ? <p className="text-text">{pose.description}</p> : null}
        </header>

        <PoseSpecCard
          cameraHeight={pose.camera_height as CameraHeight | null}
          cameraTilt={pose.camera_tilt as CameraTilt | null}
          zoom={pose.zoom as Zoom | null}
          orientation={pose.orientation as Orientation | null}
          photographerPosition={pose.photographer_position}
          distanceM={pose.distance_m}
          grid={parsePoseGrid(pose.grid)}
        />
        {invites.atSpec ? <PoseMissingSpecsInvite poseId={pose.id} kind={invites.atSpec} /> : null}
        <PoseStepList steps={pose.model_steps} />
        {invites.atSteps ? <PoseMissingSpecsInvite poseId={pose.id} kind={invites.atSteps} /> : null}

        {pose.tips ? (
          <section aria-labelledby="tips-title" className="rounded-md bg-surface-2 p-4">
            <h2 id="tips-title" className="mb-1 font-display text-[17px] font-bold">Mẹo</h2>
            <p className="whitespace-pre-line text-text">{pose.tips}</p>
          </section>
        ) : null}

        {pose.place ? (
          <Link
            href={`/places/${pose.place.id}`}
            className="inline-flex min-h-11 w-fit items-center gap-1.5 rounded-full bg-info-soft px-4 font-semibold text-info"
          >
            <MapPin className="size-4" aria-hidden /> {pose.place.name}
          </Link>
        ) : null}

        {pose.scenes.length || pose.tags.length ? (
          <ul className="flex flex-wrap gap-2" aria-label="Bối cảnh và thẻ">
            {pose.scenes.map((scene) => (
              <li key={`s-${scene}`} className="rounded-full bg-primary-soft px-3 py-1 text-[13px] font-medium text-on-primary-soft">
                {sceneLabel(scene)}
              </li>
            ))}
            {pose.tags.map((tag) => (
              <li key={`t-${tag}`} className="rounded-full bg-surface-3 px-3 py-1 text-[13px] font-medium text-text">
                #{tag}
              </li>
            ))}
          </ul>
        ) : null}

        {pose.source_url && /^https?:\/\//i.test(pose.source_url) ? (
          <p className="text-sm text-text-2">
            Nguồn:{' '}
            <a href={pose.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary underline">
              {pose.source_credit ?? sourceHost ?? 'Xem nguồn'} <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </p>
        ) : pose.source_credit ? (
          <p className="text-sm text-text-2">Nguồn: {pose.source_credit}</p>
        ) : null}
      </div>

      <PoseDetailBottomBar poseId={pose.id} isFavorite={isFavorite} />
    </div>
  );
}
