import type { VercelRequest, VercelResponse } from '@vercel/node';

// Referrer slug → Pipedrive Person ID
// Add new referrers here as needed
const REFERRERS: Record<string, number> = {
  ed: 5225, // Edward Crowell
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { name, phone, email, ref } = req.body || {};

  if (!name || !phone || !email) {
    return res.status(400).json({ success: false, error: 'Name, phone, and email are required.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, error: 'Invalid email address.' });
  }

  const apiToken = process.env.PIPEDRIVE_API_TOKEN;
  if (!apiToken) {
    console.error('PIPEDRIVE_API_TOKEN not configured');
    return res.status(500).json({ success: false, error: 'Server configuration error.' });
  }

  try {
    // Create Person in Pipedrive
    const personPayload: Record<string, unknown> = {
      name,
      email: [{ value: email, primary: true, label: 'work' }],
      phone: [{ value: phone, primary: true, label: 'work' }],
    };

    // Set "Referred By" to the referrer's Pipedrive Person ID
    const referredByKey = process.env.PIPEDRIVE_REFERRED_BY_FIELD_KEY;
    const referrerPersonId = ref ? REFERRERS[ref] : undefined;
    if (referredByKey && referrerPersonId) {
      personPayload[referredByKey] = referrerPersonId;
    }

    // Tag lead source so Pipedrive Automations can filter on it
    const leadSourceKey = process.env.PIPEDRIVE_LEAD_SOURCE_FIELD_KEY;
    if (leadSourceKey) {
      personPayload[leadSourceKey] = 'partner-form';
    }

    const personRes = await fetch(
      `https://api.pipedrive.com/v1/persons?api_token=${apiToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(personPayload),
      }
    );

    if (!personRes.ok) {
      const errBody = await personRes.text();
      console.error('Pipedrive person creation failed:', errBody);
      return res.status(502).json({ success: false, error: 'Failed to save contact.' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Lead submission error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}
