/**
 * The account, as a sheet behind the avatar — what is left of «Профиль».
 *
 * «Профиль и все ачивки убирай.» The screen was 417 lines and a tab seat before that: an avatar,
 * a name, a line, and a list of settings rows with their values on the right. Almost none of it
 * was opened twice. What an athlete actually comes to an account for is to check who they are
 * signed in as, see what level they are, and — once ever — sign out; everything else on that
 * screen was either a thing they set at sign-up or a link to somewhere else in the app.
 *
 * So it is five things and no navigation: the avatar, the name, the level, one line saying how to
 * reach the next one, and the way out. It opens from the avatar in the header of «Курсы» and from
 * the same avatar in the top row from `md` — one object, two places it is reachable from, and
 * never a screen, because an account is something you glance at and close.
 *
 * **And the inventory, which is a sixth thing and is here on purpose.** The question «что есть
 * дома» left onboarding with the rest of it, so a new profile carries `['none']` for everybody.
 * That is the safe direction — `prescribe.ts` substitutes down the `scaling.easier` chain for
 * anything the athlete has not got — but it is only safe if there is somewhere to say otherwise,
 * and this was that somewhere. Without the row, somebody who owns a pair of dumbbells trains
 * without them forever and the prescription is permanently conservative.
 *
 * The sheet is the kit's own (`components/ui/Sheet`): a sheet on a phone, a dialog from `md`. When
 * the inventory opens, this one closes: two sheets stacked are two focus traps arguing, and the
 * way back from the inventory is this sheet reopening.
 */
import { useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { HeroField, KeyTitle } from '@/components/ui/HeroField';
import { Glyph } from '@/components/ui/Icon';
import { ListRow } from '@/components/ui/ListRow';
import { Modal } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Sheet } from '@/components/ui/Sheet';
import { Switch } from '@/components/ui/Switch';
import { useToast } from '@/components/ui/Toast';
import type { Equipment } from '@/content/schema';
import { formatNumber, LANGUAGE_NAME } from '@/i18n/index';
import { isAppError } from '@/lib/api/errors';
import { setMyFeatureFlag } from '@/lib/api/flags';
import { isDemo } from '@/lib/api/mode';
import type { ProfilePatch } from '@/lib/api/types';
import { levelForPoints } from '@/lib/training/levels';
import { clubJoinHref } from '@/app/features/marathon/clubPlan';
import { ClaimSheet } from '@/app/features/payments/ClaimSheet';
import { useSound } from '@/app/features/player/sound';
import { externalLinkProps } from '@/app/hooks/useExternalLink';
import { useT } from '@/app/hooks/useT';
import { useFlag, useFlags } from '@/app/store/flags';
import { useTotalPoints } from '@/app/store/progress';
import { useSession } from '@/app/store/session';
import { DataSheet } from './DataSheet';
import { EquipmentSheet } from './EquipmentSheet';
import { LanguageSheet } from './LanguageSheet';
import { LevelsSheet } from './LevelsSheet';
import { FeatureFlags } from '@/app/features/admin/person/FeatureFlags';
import { useIsAdmin } from '@/app/features/admin/useIsAdmin';
import { NameSheet } from './NameSheet';
import { equipmentSummary, withEquipment } from './model';
import {
  subscriptionChargeNote,
  subscriptionLeadsToJoin,
  subscriptionSubtitle,
} from './subscription';

export interface ProfileSheetProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileSheet({ open, onClose }: ProfileSheetProps) {
  const tr = useT();
  const { t, l, locale } = tr;
  const navigate = useNavigate();
  const toast = useToast();
  const sound = useSound();
  const profile = useSession((s) => s.profile);
  const user = useSession((s) => s.user);
  const subscription = useSession((s) => s.subscription);
  const points = useTotalPoints();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [gear, setGear] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [levelsOpen, setLevelsOpen] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const isAdmin = useIsAdmin() === true;
  const [saving, setSaving] = useState(false);
  /*
   * The club's daily bot messages (0052): on unless the person set `club_quiet` on themselves.
   * `quietDraft` is the optimistic state while the write is in flight — a switch that waits for
   * the network before moving reads as broken — and clears once the flags are re-read.
   */
  const quiet = useFlag('club_quiet');
  const [quietDraft, setQuietDraft] = useState<boolean | null>(null);
  const [quietBusy, setQuietBusy] = useState(false);
  const tp = profile?.trainingProfile ?? null;

  const level = levelForPoints(points);
  const next = level.nextAt === null ? null : levelForPoints(level.nextAt);
  const remaining = level.nextAt === null ? 0 : Math.max(0, level.nextAt - points);
  const name = profile?.displayName ?? '';
  const email = profile?.email || user?.email || '';
  const subscriptionValue = subscriptionSubtitle(tr, subscription);
  const subscriptionJoin = subscriptionLeadsToJoin(subscription)
    ? externalLinkProps(clubJoinHref(locale, email, isDemo()))
    : null;
  const subscriptionCharge = subscriptionChargeNote(tr, subscription);

  /**
   * One writer for both editable things, so the toast, the error mapping and the busy flag cannot
   * drift apart between them. `done` closes the sheet that was open — only on success, because a
   * sheet that closes on a failed save takes the edit with it.
   */
  const save = async (patch: ProfilePatch, done: () => void) => {
    setSaving(true);
    try {
      await useSession.getState().saveProfile(patch);
      toast.show({ kind: 'success', title: t('app.profileSaved') });
      done();
    } catch (e) {
      toast.show({
        kind: 'error',
        title:
          isAppError(e) && e.code === 'network'
            ? t('common.errorOffline')
            : t('app.profileSaveError'),
      });
    } finally {
      setSaving(false);
    }
  };

  const saveEquipment = (equipment: Equipment[], dumbbellKg: number[], kettlebellKg: number[]) => {
    if (!tp) return;
    void save({ trainingProfile: withEquipment(tp, equipment, dumbbellKg, kettlebellKg) }, () =>
      setGear(false),
    );
  };

  const setQuiet = async (next: boolean) => {
    setQuietDraft(next);
    setQuietBusy(true);
    try {
      await setMyFeatureFlag('club_quiet', next);
      await useFlags.getState().load();
    } catch (e) {
      toast.show({
        kind: 'error',
        title:
          isAppError(e) && e.code === 'network'
            ? t('common.errorOffline')
            : t('app.profileSaveError'),
      });
    } finally {
      setQuietDraft(null);
      setQuietBusy(false);
    }
  };

  const signOut = async () => {
    setBusy(true);
    try {
      await useSession.getState().signOut();
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  };

  return (
    <>
      {/* One sheet at a time: two stacked are two focus traps arguing, and the way back from
          either of the small ones is this sheet reappearing underneath. */}
      <Sheet
        open={open && !gear && !renaming && !dataOpen && !levelsOpen}
        onClose={onClose}
        title={t('app.profileTitle')}
      >
        <div className="flex flex-col gap-6 pb-2">
          {/*
           * Who you are: the name, and the address that «Выйти» will leave.
           *
           * There was a 56px monogram circle to the left of them — the first letter of the name on
           * a generated colour. Nobody in this product uploads a picture, so it was a placeholder
           * for a photograph that does not exist and never will, and the head of «Курсы» dropped
           * the same circle for the same reason. What is left is the two lines that carry
           * information, one size larger now that they are not sharing the row.
           */}
          <div className="flex min-w-0 flex-col gap-1">
            {name ? <p className="display text-2xl">{name}</p> : null}
            {email ? <p className="truncate text-[13px] text-muted-2">{email}</p> : null}
          </div>

          {/*
           * The level, and the one line that says how to get the next one. That line is the reason
           * the level is here at all: a rank with no rule attached is a badge, and the athlete has
           * no way to act on it. The rule is points, and points come from training.
           *
           * It is the sheet's one blue field (style A, global.css header): the level is the thing
           * this account is *for*, its title's last word the key word.
           */}
          {/*
           * The whole card opens the ladder (LevelsSheet): «нужно добавить пояснение интерактивное
           * наших уровней». No swoosh under the title here — the progress bar right under it is
           * already a line, and the two read as one tangled stroke («прогресс конфликтует с
           * подчёркиванием»). The key word keeps its light blue.
           */}
          <HeroField className="relative isolate flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <span className="eyebrow text-on-field/85">
                {t('app.statsLevelEyebrow', { n: level.level })}
              </span>
              <span className="numeral tabular shrink-0 text-sm">
                {t('app.statsPointsValue', { n: formatNumber(locale, points) })}
              </span>
            </div>
            <h3 className="display text-2xl">
              <KeyTitle text={l(level.title)} swoosh={false} />
            </h3>
            <ProgressBar
              value={level.progress}
              tone="accent"
              ground="field"
              label={t('app.statsLevelProgress')}
              className="mt-1"
            />
            <p className="text-[13px] text-on-field/90">
              {next
                ? t('app.statsLevelNext', {
                    n: formatNumber(locale, remaining),
                    title: l(next.title),
                  })
                : t('app.statsLevelMax')}
            </p>
            <span
              aria-hidden="true"
              className="control-label mt-1 inline-flex items-center gap-1.5 text-[13px]"
            >
              {t('app.levelsOpen')}
              <Glyph size={12}>›</Glyph>
            </span>
            {/* The card's one target, laid over it like the course cards' open button: a heading
                and a section cannot live inside a <button>, so the button is a sibling. */}
            <button
              type="button"
              onClick={() => setLevelsOpen(true)}
              aria-label={t('app.levelsOpenLabel', { title: l(level.title) })}
              className="absolute inset-0 z-10 rounded-card transition-colors duration-150 ease-(--ease-out) active:bg-paper/5"
            />
          </HeroField>

          {/*
           * Three settings now. The name is first because it is the one that is *shown to other
           * people* — it is the row on the club board — and because until this row existed the
           * privacy policy promised a correction the app could not perform (152-ФЗ ст. 14; see
           * NameSheet).
           *
           * The values are the rows' trailing text, the way a phone's own settings are read.
           */}
          <ul className="-mx-6 border-y border-border md:-mx-8">
            <li>
              <ListRow
                title={t('app.profileName')}
                onClick={() => setRenaming(true)}
                trailing={
                  <>
                    <span className="max-w-[44vw] truncate text-[15px] text-muted md:max-w-[220px]">
                      {name || t('app.profileNameEmpty')}
                    </span>
                    <Glyph size={16}>›</Glyph>
                  </>
                }
              />
            </li>
            {/*
             * «Подписка» and until when (audit item 2): there is no auto-renewal and no warning,
             * so this is where a member finds the date before the club tab turns into the selling
             * screen. While it runs the row is a fact and opens nothing; before the first payment,
             * with an order still unpaid, in the last week («· продлить», so the bot's «продли в
             * приложении» is true) and once it has ended it is the way (back) in — the club's own
             * payment link, the same one `ClubPitch` sends to. No price configured and no
             * subscription: no row.
             *
             * The link goes through `externalLinkProps`: a bare anchor out of the Mini App is dead
             * or strands the member on the payment page. And since it goes straight to the annual
             * checkout, the subtitle names the one charge, as `ClubJoin` does under its button.
             */}
            {subscriptionValue ? (
              <li>
                <ListRow
                  title={t('app.profileSubscription')}
                  subtitle={subscriptionCharge || undefined}
                  href={subscriptionJoin?.href}
                  onClick={
                    subscriptionJoin
                      ? (e) => subscriptionJoin.onClick(e as MouseEvent<HTMLAnchorElement>)
                      : undefined
                  }
                  trailing={
                    <>
                      <span className="max-w-[44vw] truncate text-[15px] text-muted md:max-w-[220px]">
                        {subscriptionValue}
                      </span>
                      {subscriptionJoin ? <Glyph size={16}>›</Glyph> : null}
                    </>
                  }
                />
              </li>
            ) : null}
            {/*
             * Paid, and the club did not open: the payment came from another address. Shown
             * whenever the club is not live — nothing bought, an order waiting for its payment,
             * or the period over — the moments somebody who paid would be looking at this row.
             */}
            {subscriptionValue && !subscription?.isLive ? (
              <li>
                <ListRow
                  title={t('app.claimLink')}
                  onClick={() => setClaiming(true)}
                  trailing={<Glyph size={16}>›</Glyph>}
                />
              </li>
            ) : null}
            <li>
              <ListRow
                title={t('app.profileEquipment')}
                disabled={!tp}
                onClick={() => setGear(true)}
                trailing={
                  <>
                    <span className="max-w-[44vw] truncate text-[15px] text-muted md:max-w-[220px]">
                      {equipmentSummary(tr, tp)}
                    </span>
                    <Glyph size={16}>›</Glyph>
                  </>
                }
              />
            </li>
            {/*
             * Sound. The only setting here that is on or off, so the only one carrying a switch
             * rather than a value and a chevron — and the only row where nothing opens.
             *
             * It has to exist. The player counts the last seconds out loud, marks every move to
             * the next exercise and plays a figure at the end, and until this row there was no way
             * to stop any of it: the store had a `muted` flag that nothing in the product could
             * reach. A sound with no off switch gets the phone muted instead, which takes the one
             * cue that was worth hearing down with the rest.
             */}
            <li>
              <ListRow
                title={t('app.soundRow')}
                trailing={
                  <Switch
                    checked={!sound.muted}
                    onChange={(on) => {
                      sound.toggle();
                      // Включил — услышал, что именно включил. Тот же сигнал, что звучит чаще
                      // всего, так что это не демонстрация, а честный образец.
                      if (on) sound.beep('next');
                    }}
                    label={t('app.soundRow')}
                  />
                }
              />
            </li>
            {/*
             * The club's daily bot messages (0052): the morning task, the evening «серия сгорит»,
             * the Sunday recap. Here for everyone signed in rather than only for club members: the
             * flag is harmless to a person the bot would not write to anyway, and deciding «is this
             * person in the club» would drag the subscription and the trial window into a sheet
             * about the account. On = the bot writes; the flag stored is the *quiet* one, so the
             * switch shows its inverse.
             */}
            <li>
              <ListRow
                title={t('app.clubMessagesRow')}
                trailing={
                  <Switch
                    checked={!(quietDraft ?? quiet)}
                    disabled={quietBusy}
                    onChange={(on) => void setQuiet(!on)}
                    label={t('app.clubMessagesRow')}
                  />
                }
              />
            </li>
            {/*
             * Language, under the settings about the person themselves: it is the one row here
             * that changes every other word on the screen, and a person who reached the account
             * looking for it finds it without scrolling. The value on the right is the language's
             * own name, which is also how it is found by someone who does not read the label
             * above it.
             */}
            <li>
              <ListRow
                title={t('app.languageRow')}
                onClick={() => setLangOpen(true)}
                trailing={
                  <>
                    <span lang={locale} className="text-[15px] text-muted">
                      {LANGUAGE_NAME[locale]}
                    </span>
                    <Glyph size={16}>›</Glyph>
                  </>
                }
              />
            </li>
            {/*
             * And the row that makes the privacy policy's other two promises pressable: what is
             * held, how to withdraw the health consent, how to ask for deletion. It carries no
             * value on the right because it is a place to go rather than a setting with a state.
             */}
            <li>
              <ListRow
                title={t('app.dataRow')}
                onClick={() => setDataOpen(true)}
                trailing={<Glyph size={16}>›</Glyph>}
              />
            </li>
            {/*
             * «Позови друга — +30 дней» (0051). A place to go, like the row above it, and here
             * for the same reason the account is where people look for the things about them:
             * the referral link is theirs. The sheet closes first — a screen under an open sheet
             * is a screen nobody sees.
             */}
            <li>
              <ListRow
                title={t('app.inviteRow')}
                onClick={() => {
                  onClose();
                  navigate('/invite');
                }}
                trailing={<Glyph size={16}>›</Glyph>}
              />
            </li>
            {/*
             * The onboarding stories, again. They play once, between the questions and after the
             * last one, and a person who tapped through them on day one has nowhere else to read
             * what the difficulty sheet or the club actually do. `/intro` is the same six slides
             * with a × back to «Курсы».
             */}
            {/*
             * «Для авторов» (0064): a coach who uses Forma is the likeliest creator there is, and
             * the account is where they would look. Applying, then their own sales, live there.
             */}
            <li>
              <ListRow
                title={t('app.profileCreator')}
                onClick={() => {
                  onClose();
                  navigate('/creator');
                }}
                trailing={<Glyph size={16}>›</Glyph>}
              />
            </li>
            <li>
              <ListRow
                title={t('app.introRow')}
                onClick={() => {
                  onClose();
                  navigate('/intro');
                }}
                trailing={<Glyph size={16}>›</Glyph>}
              />
            </li>
          </ul>

          {/*
           * An admin's own feature flags, right here. The owner could not find where to switch her
           * own card on («я не вижу у себя в аккаунте мой профиль тренера»): the switch lived only
           * on her person page in the admin, three screens away. This is the same component, pointed
           * at the signed-in account, and it refreshes the app's flags on change, so the card
           * appears on «Тренер» at once. Only admins see it; the RPC refuses anyone else anyway.
           */}
          {isAdmin && email ? (
            <section className="flex flex-col gap-3" aria-label={t('app.personFeatures')}>
              <span className="eyebrow">{t('app.personFeatures')}</span>
              <FeatureFlags email={email} signedIn />
            </section>
          ) : null}

          {/* The red is on the label, not on the button: `ghost` sets its own text colour and a
              `text-danger` beside it is a coin toss on which utility the stylesheet emits last. */}
          <Button variant="ghost" size="lg" fullWidth onClick={() => setConfirm(true)}>
            <span className="text-danger">{t('app.profileSignOut')}</span>
          </Button>
        </div>
      </Sheet>
      <DataSheet open={dataOpen} email={email} onClose={() => setDataOpen(false)} />
      <LanguageSheet open={langOpen} onClose={() => setLangOpen(false)} />
      <LevelsSheet open={levelsOpen} points={points} onClose={() => setLevelsOpen(false)} />
      <ClaimSheet open={claiming} onClose={() => setClaiming(false)} />
      <NameSheet
        open={renaming}
        name={name}
        busy={saving}
        onClose={() => setRenaming(false)}
        onSave={(next) => void save({ displayName: next }, () => setRenaming(false))}
      />
      {tp ? (
        <EquipmentSheet
          open={gear}
          profile={tp}
          busy={saving}
          onClose={() => setGear(false)}
          onSave={saveEquipment}
        />
      ) : null}
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title={t('app.profileSignOutTitle')}
        description={t('app.profileSignOutBody')}
        confirmLabel={t('app.profileSignOut')}
        cancelLabel={t('common.cancel')}
        danger
        loading={busy}
        onConfirm={() => void signOut()}
      />
    </>
  );
}
