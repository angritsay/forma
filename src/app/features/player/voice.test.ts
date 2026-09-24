/**
 * The spoken names, against a fake AudioContext: there is no WebAudio in node, and what matters
 * here is the bookkeeping around it — one fetch and one decode per recording, a failure that does
 * not poison the rest, one voice at a time, and silence when the sound is off.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as SoundModule from './sound';
import type * as VoiceModule from './voice';

const resolveMediaUrl = vi.fn<(ref: string | undefined) => Promise<string | undefined>>();
vi.mock('@/lib/api/storage', () => ({ resolveMediaUrl: (ref: string) => resolveMediaUrl(ref) }));

class FakeSource {
  buffer: unknown = null;
  started = false;
  stopped = false;
  onended: (() => void) | null = null;
  connect<T>(node: T): T {
    return node;
  }
  start(): void {
    this.started = true;
  }
  stop(): void {
    this.stopped = true;
  }
  disconnect(): void {}
}

class FakeGain {
  gain = { value: 1 };
  connect<T>(node: T): T {
    return node;
  }
}

class FakeContext {
  static last: FakeContext | null = null;
  state = 'running';
  destination = {};
  sources: FakeSource[] = [];
  decoded = 0;
  constructor() {
    FakeContext.last = this;
  }
  resume(): Promise<void> {
    return Promise.resolve();
  }
  createBufferSource(): FakeSource {
    const s = new FakeSource();
    this.sources.push(s);
    return s;
  }
  createGain(): FakeGain {
    return new FakeGain();
  }
  decodeAudioData(bytes: ArrayBuffer): Promise<AudioBuffer> {
    this.decoded += 1;
    return Promise.resolve({ duration: bytes.byteLength / 1000 } as AudioBuffer);
  }
}

const fetchMock = vi.fn<(url: string) => Promise<Response>>();

function okResponse(bytes: number): Response {
  return {
    ok: true,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(bytes)),
  } as unknown as Response;
}

const RU = 'storage:audio/shared/downward_dog.ru.m4a';
const EN = 'storage:audio/shared/downward_dog.en.m4a';

let voice: typeof VoiceModule;
let sound: typeof SoundModule;

beforeEach(async () => {
  // Each test gets a fresh module graph: the decode cache and the context are module state.
  vi.resetModules();
  vi.stubGlobal('window', { AudioContext: FakeContext });
  vi.stubGlobal('fetch', fetchMock);
  FakeContext.last = null;
  resolveMediaUrl.mockReset();
  fetchMock.mockReset();
  resolveMediaUrl.mockImplementation(async (ref) => (ref ? `https://signed/${ref}` : undefined));
  fetchMock.mockImplementation(async () => okResponse(1500));
  voice = await import('./voice');
  sound = await import('./sound');
  sound.useSoundStore.setState({ muted: false });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('prefetchVoice', () => {
  it('fetches and decodes each recording once, however often it is asked for', async () => {
    await voice.prefetchVoice([RU, EN, RU]);
    await voice.prefetchVoice([RU]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(FakeContext.last?.decoded).toBe(2);
  });

  it('skips a ref the backend cannot resolve, as the demo does for storage refs', async () => {
    resolveMediaUrl.mockResolvedValue(undefined);
    await voice.prefetchVoice([RU]);
    expect(fetchMock).not.toHaveBeenCalled();
    voice.playVoice(RU);
    expect(FakeContext.last?.sources ?? []).toHaveLength(0);
  });

  it('tolerates a failed fetch and still decodes the others', async () => {
    fetchMock.mockImplementation(async (url) => {
      if (url.includes('.ru.')) throw new Error('offline');
      return okResponse(1000);
    });
    await expect(voice.prefetchVoice([RU, EN])).resolves.toBeUndefined();
    voice.playVoice(RU);
    expect(FakeContext.last?.sources).toHaveLength(0);
    voice.playVoice(EN);
    expect(FakeContext.last?.sources).toHaveLength(1);
    // The failure is remembered: the next prefetch does not fetch it again.
    fetchMock.mockClear();
    await voice.prefetchVoice([RU]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('playVoice', () => {
  it('says nothing that has not decoded yet, and nothing for no ref', async () => {
    voice.playVoice(RU);
    voice.playVoice(undefined);
    expect(FakeContext.last?.sources ?? []).toHaveLength(0);
    await voice.prefetchVoice([RU]);
    voice.playVoice(RU);
    expect(FakeContext.last?.sources).toHaveLength(1);
    expect(FakeContext.last?.sources[0]?.started).toBe(true);
  });

  it('stops the previous voice before starting the next: one name at a time', async () => {
    await voice.prefetchVoice([RU, EN]);
    voice.playVoice(RU);
    voice.playVoice(EN);
    const [first, second] = FakeContext.last!.sources;
    expect(first?.stopped).toBe(true);
    expect(second?.started).toBe(true);
    expect(second?.stopped).toBe(false);
    voice.stopVoice();
    expect(second?.stopped).toBe(true);
    // Stopping twice, or with nothing playing, is fine.
    voice.stopVoice();
  });

  it('creates no source while the sound is off', async () => {
    await voice.prefetchVoice([RU]);
    sound.useSoundStore.setState({ muted: true });
    voice.playVoice(RU);
    expect(FakeContext.last?.sources).toHaveLength(0);
    sound.useSoundStore.setState({ muted: false });
    voice.playVoice(RU);
    expect(FakeContext.last?.sources).toHaveLength(1);
  });
});

describe('playVoice while the recording is still decoding', () => {
  /** A fetch held open until the test lets it go: a slow connection, on demand. */
  function holdFetch(): () => void {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    fetchMock.mockImplementation(async () => {
      await gate;
      return okResponse(1500);
    });
    return release;
  }

  it('says the first name once it decodes, if its step is still current', async () => {
    const release = holdFetch();
    const loading = voice.prefetchVoice([RU]);
    voice.playVoice(RU);
    expect(FakeContext.last?.sources ?? []).toHaveLength(0);
    release();
    await loading;
    await vi.waitFor(() => expect(FakeContext.last?.sources).toHaveLength(1));
    expect(FakeContext.last?.sources[0]?.started).toBe(true);
  });

  it('stays silent when the step was left (stopVoice) before it decoded', async () => {
    const release = holdFetch();
    const loading = voice.prefetchVoice([RU]);
    voice.playVoice(RU);
    voice.stopVoice();
    release();
    await loading;
    await new Promise((r) => setTimeout(r, 0));
    expect(FakeContext.last?.sources ?? []).toHaveLength(0);
  });

  it('stays silent when another voice was asked for in the meantime', async () => {
    await voice.prefetchVoice([EN]);
    const release = holdFetch();
    const loading = voice.prefetchVoice([RU]);
    voice.playVoice(RU);
    voice.playVoice(EN);
    release();
    await loading;
    await new Promise((r) => setTimeout(r, 0));
    const sources = FakeContext.last!.sources;
    expect(sources).toHaveLength(1);
    expect(sources[0]?.buffer).toBeTruthy();
  });

  it('gives up after the wait: a name that arrives too late is not said late', async () => {
    const release = holdFetch();
    const loading = voice.prefetchVoice([RU]);
    voice.playVoice(RU, { waitMs: 5 });
    await new Promise((r) => setTimeout(r, 20));
    release();
    await loading;
    await new Promise((r) => setTimeout(r, 0));
    expect(FakeContext.last?.sources ?? []).toHaveLength(0);
  });
});
