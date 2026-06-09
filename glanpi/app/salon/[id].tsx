import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Share, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader, useCollapsingHeader } from '@/components/layout';
import {
  BusinessHoursList,
  SalonAbout,
  SalonDetail,
  SalonHero,
  SalonIdentity,
  StaffStrip,
  type BusinessHoursRow,
  type SalonServiceRow,
  type StaffStripMember,
} from '@/components/salon';
import {
  GBottomBar,
  GButton,
  GEmptyState,
  GIconButton,
  GScreen,
  GSpinner,
  GText,
} from '@/components/ui';
import { useBusinessHours } from '@/hooks/use-business-hours';
import { useSalon } from '@/hooks/use-salon';
import { useSalonServices } from '@/hooks/use-salon-services';
import { useSalonStaff } from '@/hooks/use-salon-staff';
import { useSalonThumbnails } from '@/hooks/use-salon-thumbnails';
import { track } from '@/lib/analytics';
import {
  dayOfWeekMon0,
  formatSlotTime,
  getOpenStatus,
  todayInTz,
  weekdayLongPL,
} from '@/lib/datetime';
import { formatDuration, formatPrice } from '@/lib/format';
import { useAppTheme } from '@/theme';

/**
 * Salon Detail (design §4). One LegendList — gallery/identity/about in the
 * header, services as items, staff/hours in the footer — with a scroll-collapsing
 * compact bar and a sticky "Zarezerwuj wizytę" CTA. Reached from a Find card or
 * the Post Detail salon strip.
 */
export default function SalonDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { app } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const numericId = Number(id);
  const { scrollOffset, compactBarStyle } = useCollapsingHeader({ collapseThreshold: 240 });

  const salonQuery = useSalon(id);
  const { data: services } = useSalonServices(numericId);
  const { data: staff } = useSalonStaff(id);
  const { data: hours } = useBusinessHours(id);
  const images = useSalonThumbnails(numericId);

  const salon = salonQuery.data;

  useEffect(() => {
    track('salon_open', { salon_id: id });
  }, [id]);

  const serviceRows = useMemo<SalonServiceRow[]>(
    () =>
      (services ?? []).map((s) => ({
        id: String(s.id),
        name: s.name,
        duration: formatDuration(s.duration_minutes),
        price: formatPrice(s.price_display),
      })),
    [services],
  );

  const staffMembers = useMemo<StaffStripMember[]>(
    () => (staff ?? []).map((m) => ({ id: String(m.id), name: m.display_name })),
    [staff],
  );

  const hoursRows = useMemo<BusinessHoursRow[]>(() => {
    if (!hours || hours.length === 0) return [];
    const todayDow = dayOfWeekMon0(todayInTz(salon?.timezone));
    return Array.from({ length: 7 }, (_, dow) => {
      const h = hours.find((x) => x.day_of_week === dow);
      const closed = !h || h.is_closed || !h.open_time || !h.close_time;
      return {
        id: String(dow),
        label: weekdayLongPL(dow),
        value: closed
          ? t('salon.closedShort')
          : `${formatSlotTime(h!.open_time!)}–${formatSlotTime(h!.close_time!)}`,
        isToday: dow === todayDow,
      };
    });
  }, [hours, salon?.timezone, t]);

  const openNow = useMemo(() => {
    const status = getOpenStatus(hours, salon?.timezone);
    if (!status) return undefined;
    if (status.state === 'open') {
      return { label: t('salon.openNow', { time: status.until }), tone: 'success' as const };
    }
    if (status.state === 'closedToday') {
      return { label: t('salon.closedToday'), tone: 'muted' as const };
    }
    return { label: t('salon.closedNow'), tone: 'muted' as const };
  }, [hours, salon?.timezone, t]);

  // --- loading / error ---
  if (salonQuery.isLoading) {
    return (
      <GScreen edges={['top']}>
        <GSpinner centered />
      </GScreen>
    );
  }
  if (salonQuery.isError || !salon) {
    return (
      <GScreen edges={['top']}>
        <GEmptyState
          icon="storefront-outline"
          title={t('salon.error')}
          actionLabel={t('find.error.retry')}
          onAction={() => salonQuery.refetch()}
        />
      </GScreen>
    );
  }

  const hasServices = serviceRows.length > 0;
  const servicesLoaded = services != null;

  const openBooking = (serviceId?: string) =>
    router.push({
      pathname: '/booking/service',
      params: serviceId
        ? { salonId: String(salon.id), serviceId }
        : { salonId: String(salon.id) },
    });

  const onCall = salon.phone
    ? () => Linking.openURL(`tel:${salon.phone}`)
    : undefined;
  const onDirections = () => {
    const query =
      salon.latitude != null && salon.longitude != null
        ? `${salon.latitude},${salon.longitude}`
        : encodeURIComponent(`${salon.name} ${salon.address} ${salon.city}`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };
  const onShare = () =>
    Share.share({ message: `${salon.name} — ${salon.address}, ${salon.city}` });

  const header = (
    <View>
      <SalonHero images={images} onBack={() => router.back()} onShare={onShare} />
      <View style={[styles.headerBody, { padding: app.spacing.lg, gap: app.spacing.lg }]}>
        <SalonIdentity
          name={salon.name}
          rating={Number(salon.avg_rating) || 0}
          reviewCount={salon.review_count}
          address={`${salon.city} · ${salon.address}`}
          openNow={openNow}
          callLabel={t('salon.call')}
          directionsLabel={t('salon.directions')}
          onCall={onCall}
          onDirections={onDirections}
        />
        <SalonAbout
          title={t('salon.about')}
          description={salon.description}
          moreLabel={t('post.more')}
          lessLabel={t('post.less')}
        />
        <GText variant="titleSmall">{t('salon.services')}</GText>
      </View>
    </View>
  );

  const footer = (
    <View style={[styles.footer, { padding: app.spacing.lg, gap: app.spacing.xl }]}>
      {!hasServices && servicesLoaded && (
        <GText variant="body" color="muted">
          {t('salon.noServices')}
        </GText>
      )}
      <StaffStrip title={t('salon.team')} members={staffMembers} />
      <BusinessHoursList title={t('salon.hours')} rows={hoursRows} />
    </View>
  );

  return (
    <GScreen edges={[]} padded={false}>
      {/* Scroll-collapsing compact bar with back + name. */}
      <View style={styles.compactBarOuter} pointerEvents="box-none">
        <Animated.View style={compactBarStyle}>
          <AppHeader
            compact
            title={salon.name}
            leading={
              <GIconButton icon="chevron-left" size={22} onPress={() => router.back()} />
            }
            style={{
              paddingTop: insets.top + app.spacing.xs,
              backgroundColor: app.colors.background,
              ...app.elevation.card,
            }}
          />
        </Animated.View>
      </View>

      <SalonDetail
        services={serviceRows}
        onPressService={openBooking}
        sharedScrollOffset={scrollOffset}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
      />

      {hasServices && (
        <GBottomBar>
          <GButton
            fullWidth
            label={t('salon.book')}
            onPress={() => openBooking()}
            testID="salon-book-cta"
          />
        </GBottomBar>
      )}
    </GScreen>
  );
}

const styles = StyleSheet.create({
  compactBarOuter: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  headerBody: {},
  footer: {},
});
