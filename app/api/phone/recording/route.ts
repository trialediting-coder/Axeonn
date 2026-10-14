// recordingStatusCallback: the recording is ready. Attach it to the call.
import { readTwilioRequest } from '@/lib/phoneWebhook';
import { attachRecording } from '@/lib/phoneLines';
import { projectCall } from '@/lib/contacts';
import { errText } from '@/lib/dbRows';
import { redactDigits } from '@/lib/sequenceSchedule';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const read = await readTwilioRequest(req, '/api/phone/recording');
  if (!read.ok) return read.response;
  const p = read.params;
  if (p.CallSid && p.RecordingUrl && p.RecordingStatus === 'completed') {
    const seconds = p.RecordingDuration ? Number.parseInt(p.RecordingDuration, 10) : null;
    try {
      await attachRecording(p.CallSid, p.RecordingUrl, seconds !== null && Number.isFinite(seconds) ? seconds : null);
    } catch (err) {
      console.error('[phone/recording]', err instanceof Error ? err.message : err);
      return new Response(null, { status: 500 });
    }
    // The inbox's play button appears once the event knows a recording exists. No URL is copied.
    await projectCall(p.CallSid).catch((err) => console.error('[phone/recording] inbox', p.CallSid, redactDigits(errText(err))));
  }
  return new Response(null, { status: 204 });
}
