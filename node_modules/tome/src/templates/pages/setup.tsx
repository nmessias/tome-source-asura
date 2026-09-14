/**
 * Setup page template
 */
import { Layout } from "../layout";
import { Nav, Alert } from "../components";
import type { ReaderSettings } from "../../config";
import { DEFAULT_READER_SETTINGS } from "../../config";

export function SetupPage({
  message,
  isError,
  settings = DEFAULT_READER_SETTINGS,
}: {
  message?: string;
  isError?: boolean;
  settings?: ReaderSettings;
}): JSX.Element {
  return (
    <Layout title="Setup" settings={settings}>
      <Nav currentPath="/setup" />
      <h1>Cookie Setup</h1>
      {message && <Alert message={message} isError={isError} />}
      <p>
        Enter your Royal Road session cookies below. You can find these in your
        browser's developer tools (F12 → Application → Cookies).
      </p>
      <form method="POST" action="/setup">
        <label for="identity">.AspNetCore.Identity.Application cookie:</label>
        <textarea
          name="identity"
          id="identity"
          placeholder="Paste your .AspNetCore.Identity.Application cookie value here (this is the main auth cookie)"
        ></textarea>

        <p style="margin-top: 16px; font-size: 14px;">
          <strong>Optional:</strong> These may help if you have issues:
        </p>

        <label for="cfclearance">cf_clearance cookie (Cloudflare bypass):</label>
        <textarea
          name="cfclearance"
          id="cfclearance"
          placeholder="Optional - paste if you get Cloudflare errors"
        ></textarea>

        <div style="margin-top: 16px;">
          <button type="submit" class="btn">
            Save Cookies
          </button>
          <a href="/setup/clear" class="btn btn-outline">
            Clear Cookies
          </a>
        </div>
      </form>
    </Layout>
  );
}
