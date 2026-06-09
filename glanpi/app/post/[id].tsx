import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import {
  getBusinessHours,
  getStaff,
  queryKeys,
} from '@/api';
import { mockImageUrl, USE_MOCK_IMAGES } from '@/components/feed';
import { FeaturedServiceCard, PostDetailView, PostSalonStrip } from '@/components/post';
import { GBottomBar, GButton, GEmptyState, GScreen, GSpinner } from '@/components/ui';
import { usePost } from '@/hooks/use-post';
import { usePostBooking } from '@/hooks/use-post-booking';
import { useSalon } from '@/hooks/use-salon';
import { track } from '@/lib/analytics';
import { formatDuration, formatPrice } from '@/lib/format';

/**
 * Post Detail (design §3). Lets the photo sell, then offers a single
 * "Zarezerwuj" CTA. Enriches the salon strip with rating via `useSalon` and
 * prefetches the salon's queries on strip-press for an instant hop (plan §8.6).
 */
export default function PostDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();

  const postQuery = usePost(id);
  const { data: booking } = usePostBooking(id);
  const post = postQuery.data;

  // Canonical salon id: prefer the booking payload's (also used for the booking
  // call), fall back to the post's. Drives strip enrichment + prefetch.
  const salonId = booking?.salon.id ?? post?.salon.id;
  const { data: salon } = useSalon(salonId);

  useEffect(() => {
    track('post_open', { post_id: id });
  }, [id]);

  if (postQuery.isLoading && !post) {
    return (
      <GScreen edges={['top']}>
        <GSpinner centered />
      </GScreen>
    );
  }

  if (postQuery.isError || !post) {
    return (
      <GScreen edges={['top']}>
        <GEmptyState
          icon="image-off-outline"
          title={t('post.notFound')}
          actionLabel={t('post.retry')}
          onAction={() => postQuery.refetch()}
        />
      </GScreen>
    );
  }

  const imageUrl = USE_MOCK_IMAGES ? mockImageUrl(post.id, 0.8) : post.image_url;

  // The service the post "presents": the explicit featured_service, else the
  // backend's top recommendation for this post (ui_hints). Either one drives the
  // featured card and lands preselected on the booking service screen. The seed
  // backend leaves featured_service null, so without the recommended fallback
  // nothing is ever presented or preselected.
  const featured =
    booking?.featured_service ?? booking?.ui_hints?.recommended_services?.[0] ?? null;
  const featuredServiceId = featured?.id ?? post.featured_service?.id;

  const onPressSalon = () => {
    if (salonId != null) {
      queryClient.prefetchQuery({
        queryKey: queryKeys.salons.staff(salonId),
        queryFn: () => getStaff(salonId),
      });
      queryClient.prefetchQuery({
        queryKey: queryKeys.salons.hours(salonId),
        queryFn: () => getBusinessHours(salonId),
      });
      router.push(`/salon/${salonId}`);
    }
  };

  const onBook = () =>
    router.push({
      pathname: '/booking/service',
      params: {
        salonId: String(salonId ?? post.salon.id),
        postId: id,
        ...(featuredServiceId != null ? { serviceId: String(featuredServiceId) } : {}),
      },
    });

  const featuredMeta = featured
    ? [formatDuration(featured.duration_minutes), formatPrice(featured.price_display)]
        .filter(Boolean)
        .join(' · ')
    : '';

  return (
    <GScreen edges={[]} padded={false}>
      <PostDetailView
        imageUrl={imageUrl}
        categoryLabel={t(`explore.category.${post.post_type}`)}
        likesCount={post.likes_count}
        title={post.title}
        description={post.description}
        moreLabel={t('post.more')}
        lessLabel={t('post.less')}
        author={post.author ? { name: post.author.display_name } : undefined}
        salonStrip={
          <PostSalonStrip
            name={post.salon.name}
            city={salon?.city ?? post.salon.city}
            rating={salon ? Number(salon.avg_rating) || 0 : undefined}
            reviewCount={salon?.review_count}
            onPress={onPressSalon}
          />
        }
        featuredCard={
          featured ? (
            <FeaturedServiceCard
              label={t('post.featuredService')}
              serviceName={featured.name}
              meta={featuredMeta}
            />
          ) : undefined
        }
        onBack={() => router.back()}
      />

      <GBottomBar>
        <GButton fullWidth label={t('post.book')} onPress={onBook} testID="post-book-cta" />
      </GBottomBar>
    </GScreen>
  );
}
