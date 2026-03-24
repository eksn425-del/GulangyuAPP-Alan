using System;
using System.Collections.Concurrent;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using UnityEngine;

[Serializable]
public class HazardPayload
{
    public string hazard_type;
    public float x;
    public float y;
    public float z;
    public string client_source = "unity";
}

public class DigitalCane : MonoBehaviour
{
    [SerializeField] private string defaultApiBaseUrl = "http://127.0.0.1:8000";
    [SerializeField] private float debounceSeconds = 1f;
    private static readonly HttpClient HttpClient = new HttpClient();
    private static readonly int[] RetryBackoffMs = { 500, 1000, 2000 };
    private readonly ConcurrentQueue<HazardPayload> reportQueue = new ConcurrentQueue<HazardPayload>();
    private readonly ConcurrentDictionary<string, DateTime> lastReportTime = new ConcurrentDictionary<string, DateTime>();
    private CancellationTokenSource queueWorkerCts;
    private Task queueWorkerTask;
    private string apiBaseUrl;

    private void Awake()
    {
        var envUrl = Environment.GetEnvironmentVariable("GULANGYU_API_BASE_URL");
        apiBaseUrl = string.IsNullOrWhiteSpace(envUrl) ? defaultApiBaseUrl : envUrl.TrimEnd('/');
    }

    private void OnEnable()
    {
        StartQueueWorker();
    }

    private void OnDisable()
    {
        _ = StopQueueWorkerAsync();
    }

    private void OnDestroy()
    {
        _ = StopQueueWorkerAsync();
    }

    public void ReportHazard(string hazardType, Vector3 position)
    {
        if (string.IsNullOrWhiteSpace(hazardType))
        {
            return;
        }

        if (!CanEnqueue(hazardType, position))
        {
            return;
        }

        var payload = new HazardPayload
        {
            hazard_type = hazardType,
            x = position.x,
            y = position.y,
            z = position.z
        };
        reportQueue.Enqueue(payload);
    }

    private bool CanEnqueue(string hazardType, Vector3 position)
    {
        var now = DateTime.UtcNow;
        var key = BuildDebounceKey(hazardType, position);

        if (lastReportTime.TryGetValue(key, out var lastTime))
        {
            if ((now - lastTime).TotalSeconds < debounceSeconds)
            {
                return false;
            }
        }

        lastReportTime[key] = now;
        return true;
    }

    private static string BuildDebounceKey(string hazardType, Vector3 position)
    {
        var qx = Math.Round(position.x, 2);
        var qy = Math.Round(position.y, 2);
        var qz = Math.Round(position.z, 2);
        return $"{hazardType}|{qx}|{qy}|{qz}";
    }

    private void StartQueueWorker()
    {
        if (queueWorkerTask != null && !queueWorkerTask.IsCompleted)
        {
            return;
        }

        queueWorkerCts = new CancellationTokenSource();
        queueWorkerTask = Task.Run(() => ConsumeQueueAsync(queueWorkerCts.Token));
    }

    private async Task StopQueueWorkerAsync()
    {
        var cts = queueWorkerCts;
        var worker = queueWorkerTask;

        if (cts == null)
        {
            return;
        }

        queueWorkerCts = null;
        queueWorkerTask = null;
        cts.Cancel();

        if (worker != null)
        {
            try
            {
                await worker;
            }
            catch (OperationCanceledException)
            {
            }
        }

        cts.Dispose();
    }

    private async Task ConsumeQueueAsync(CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            if (reportQueue.TryDequeue(out var payload))
            {
                await SendWithRetryAsync(payload, cancellationToken);
                continue;
            }

            await Task.Delay(20, cancellationToken);
        }
    }

    private async Task SendWithRetryAsync(HazardPayload payload, CancellationToken cancellationToken)
    {
        const int maxRetries = 3;

        for (var attempt = 0; attempt <= maxRetries; attempt++)
        {
            var success = await SendHazardAsync(payload, cancellationToken);
            if (success)
            {
                return;
            }

            if (attempt == maxRetries)
            {
                return;
            }

            await Task.Delay(RetryBackoffMs[attempt], cancellationToken);
        }
    }

    private async Task<bool> SendHazardAsync(HazardPayload payload, CancellationToken cancellationToken)
    {
        var json = JsonUtility.ToJson(payload);
        using (var content = new StringContent(json, Encoding.UTF8, "application/json"))
        {
            try
            {
                var response = await HttpClient.PostAsync($"{apiBaseUrl}/api/record_hazard", content, cancellationToken);
                return response.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }
    }
}
