/**
 * Cache management page template
 */
import { Layout } from "../layout";
import { Nav, Alert, formatBytes } from "../components";
import type { CacheStats } from "../../services/cache";
import type { ReaderSettings } from "../../config";
import { DEFAULT_READER_SETTINGS } from "../../config";

/**
 * Cache management page
 */
export function CachePage({
  stats,
  message,
  settings = DEFAULT_READER_SETTINGS,
}: {
  stats: CacheStats;
  message?: string;
  settings?: ReaderSettings;
}): JSX.Element {
  const totalSize = stats.totalSize + stats.imageSize;

  return (
    <Layout title="Cache Management" settings={settings}>
      <Nav currentPath="/cache" />
      <h1>Cache Management</h1>
      {message && <Alert message={message} />}

      <div style="margin-bottom: 20px;">
        <h2>Summary</h2>
        <ul>
          <li>
            <strong>Total text entries:</strong> {stats.totalEntries}
          </li>
          <li>
            <strong>Total text size:</strong> {formatBytes(stats.totalSize)}
          </li>
          <li>
            <strong>Cached images:</strong> {stats.imageCount}
          </li>
          <li>
            <strong>Image cache size:</strong> {formatBytes(stats.imageSize)}
          </li>
          <li>
            <strong>Total cache size:</strong> {formatBytes(totalSize)}
          </li>
          {stats.expiredCount > 0 && (
            <li>
              <strong>Expired entries:</strong> {stats.expiredCount}
            </li>
          )}
        </ul>
      </div>

      <div style="margin-bottom: 20px;">
        <h2>Cache by Type</h2>
        {stats.byType.length > 0 ? (
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid #000;">
                <th style="text-align: left; padding: 8px 4px;">Type</th>
                <th style="text-align: right; padding: 8px 4px;">Count</th>
                <th style="text-align: right; padding: 8px 4px;">Size</th>
                <th style="padding: 8px 4px;"></th>
              </tr>
            </thead>
            <tbody>
              {stats.byType.map((t) => (
                <tr>
                  <td safe>{t.type}</td>
                  <td style="text-align: right;">{t.count}</td>
                  <td style="text-align: right;">{formatBytes(t.size)}</td>
                  <td>
                    <a
                      href={`/cache/clear/${t.type}`}
                      class="btn btn-outline"
                      style="padding: 4px 8px; font-size: 12px;"
                    >
                      Clear
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No cached entries.</p>
        )}
      </div>

      <div style="margin-bottom: 20px;">
        <h2>Actions</h2>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          {stats.expiredCount > 0 && (
            <a href="/cache/clear/expired" class="btn btn-outline">
              Clear Expired ({stats.expiredCount})
            </a>
          )}
          {stats.imageCount > 0 && (
            <a href="/cache/clear/images" class="btn btn-outline">
              Clear Images ({stats.imageCount})
            </a>
          )}
          <a href="/cache/clear/all" class="btn">
            Clear All Cache
          </a>
        </div>
      </div>

      <div style="margin-top: 20px;">
        <a href="/" class="btn btn-outline">
          Back to Home
        </a>
      </div>
    </Layout>
  );
}
