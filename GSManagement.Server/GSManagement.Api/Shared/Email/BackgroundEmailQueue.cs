using System.Threading.Channels;

namespace GSManagement.Api.Shared.Email;

// A bounded queue of outgoing emails processed by a hosted BackgroundService.
// Using a Channel instead of Task.Run means the host waits for pending sends
// during graceful shutdown, so emails aren't silently dropped.

public interface IBackgroundEmailQueue
{
    /// Enqueue an email to be sent in the background.
    void Enqueue(string toEmail, string subject, string htmlBody);
}

public sealed class BackgroundEmailQueue : IBackgroundEmailQueue
{
    // Bounded so a burst of requests can't grow memory without limit.
    private readonly Channel<EmailMessage> _channel =
        Channel.CreateBounded<EmailMessage>(new BoundedChannelOptions(200)
        {
            FullMode = BoundedChannelFullMode.DropOldest
        });

    internal ChannelReader<EmailMessage> Reader => _channel.Reader;

    public void Enqueue(string toEmail, string subject, string htmlBody)
    {
        _channel.Writer.TryWrite(new EmailMessage(toEmail, subject, htmlBody));
    }

    internal sealed record EmailMessage(string ToEmail, string Subject, string HtmlBody);
}

public sealed class BackgroundEmailService(
    BackgroundEmailQueue queue,
    IEmailSender emailSender,
    ILogger<BackgroundEmailService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var msg in queue.Reader.ReadAllAsync(stoppingToken))
        {
            try
            {
                await emailSender.SendAsync(msg.ToEmail, msg.Subject, msg.HtmlBody, stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to send background email to {To}", msg.ToEmail);
            }
        }
    }
}
