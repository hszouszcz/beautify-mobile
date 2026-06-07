/**
 * TEMPORARY dev-only verification screen for the API/auth layer.
 * Delete this file (and any link to it) once verified — it is not part of MVP.
 *
 * Open it with:  npx uri-scheme open glanpi://dev-auth --ios   (or --android)
 */
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { API_BASE_URL, tokenStorage } from '@/api';
import { GButton, GScreen, GText } from '@/components/ui';
import { useAuth } from '@/hooks/use-auth';
import { useCityFeed } from '@/hooks/use-city-feed';
import { useInitiatePhoneAuth, useVerifyPhoneAuth } from '@/hooks/use-phone-auth';
import { useMe } from '@/hooks/use-me';

export default function DevAuthScreen() {
  const [phone, setPhone] = useState('+48111111111');
  const [code, setCode] = useState('1111');
  const [city, setCity] = useState('Warsaw');

  const { status, user, signOut } = useAuth();
  const initiate = useInitiatePhoneAuth();
  const verify = useVerifyPhoneAuth();
  const me = useMe();
  const feed = useCityFeed(city);

  const feedCount = feed.data?.pages.reduce((n, p) => n + p.results.length, 0) ?? 0;

  return (
    <GScreen edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <GText variant="title">API layer check</GText>
        <GText variant="caption" color="muted">
          {API_BASE_URL}
        </GText>
        <GText>session: {status}</GText>
        {user ? <GText>user: {user.phone} ({user.role})</GText> : null}

        <View style={styles.row}>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+48111111111"
            autoCapitalize="none"
          />
          <TextInput style={styles.input} value={code} onChangeText={setCode} placeholder="1111" />
        </View>

        <GText variant="caption">1. Send SMS code</GText>
        <GButton
          label={initiate.isPending ? 'Sending…' : 'Initiate'}
          onPress={() => initiate.mutate({ phone })}
          disabled={initiate.isPending}
        />
        {initiate.isSuccess ? <GText color="primary">sent: {initiate.data.phone_number_hint}</GText> : null}
        {initiate.error ? <GText color="danger">{initiate.error.status}: {initiate.error.message}</GText> : null}

        <GText variant="caption">2. Verify → sign in (proves token storage)</GText>
        <GButton
          label={verify.isPending ? 'Verifying…' : 'Verify'}
          onPress={() => verify.mutate({ phone, code })}
          disabled={verify.isPending}
        />
        {verify.error ? <GText color="danger">{verify.error.status}: {verify.error.message}</GText> : null}

        <GText variant="caption">3. GET /me (proves Bearer attach)</GText>
        <GButton kind="secondary" label="Refetch me" onPress={() => me.refetch()} />
        <GText>
          me: {me.isFetching ? 'loading…' : me.data ? `${me.data.first_name || '(no name)'} ✓` : '—'}
        </GText>
        {me.error ? <GText color="danger">{me.error.status}: {me.error.message}</GText> : null}

        <GText variant="caption">4. Public city feed (proves infinite query)</GText>
        <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="Warsaw" />
        <GText>feed items loaded: {feedCount} {feed.isFetching ? '(fetching…)' : ''}</GText>
        {feed.hasNextPage ? (
          <GButton kind="text" label="Load more" onPress={() => feed.fetchNextPage()} />
        ) : null}
        {feed.error ? <GText color="danger">{feed.error.status}: {feed.error.message}</GText> : null}

        <GText variant="caption">5. Logout (clears keychain + cache)</GText>
        <GButton
          kind="secondary"
          label="Sign out"
          onPress={async () => {
            await signOut();
            console.log('access after logout:', tokenStorage.getAccessTokenSync());
          }}
        />
      </ScrollView>
    </GScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 8, paddingVertical: 16 },
  row: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
