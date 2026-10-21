using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Options;

namespace GSManagement.Api.Shared.Storage;

// Cloudflare R2 is S3-compatible, so it is accessed through the AWS S3 SDK.
public class R2FileStorage : IFileStorage, IDisposable
{
    private readonly AmazonS3Client _client;
    private readonly R2Options _options;
    private readonly ILogger<R2FileStorage> _logger;

    public R2FileStorage(IOptions<R2Options> options, ILogger<R2FileStorage> logger)
    {
        _options = options.Value;
        _logger = logger;

        var config = new AmazonS3Config
        {
            ServiceURL = $"https://{_options.AccountId}.r2.cloudflarestorage.com",
            AuthenticationRegion = "auto",
            ForcePathStyle = true,
            // R2 doesn't support the SDK's default trailing checksums.
            RequestChecksumCalculation = RequestChecksumCalculation.WHEN_REQUIRED,
            ResponseChecksumValidation = ResponseChecksumValidation.WHEN_REQUIRED,
        };

        _client = new AmazonS3Client(
            new BasicAWSCredentials(_options.AccessKeyId, _options.SecretAccessKey), config);
    }

    public async Task<string> UploadAsync(Stream content, string key, string contentType, CancellationToken ct)
    {
        var request = new PutObjectRequest
        {
            BucketName = _options.BucketName,
            Key = key,
            InputStream = content,
            ContentType = contentType,
            // R2 doesn't support streaming SigV4 payload signing.
            DisablePayloadSigning = true,
        };

        await _client.PutObjectAsync(request, ct);
        return $"{_options.PublicBaseUrl.TrimEnd('/')}/{key}";
    }

    public async Task DeleteByUrlAsync(string? url, CancellationToken ct)
    {
        var prefix = _options.PublicBaseUrl.TrimEnd('/') + "/";
        if (string.IsNullOrWhiteSpace(url) || !url.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var key = url[prefix.Length..];
        try
        {
            await _client.DeleteObjectAsync(_options.BucketName, key, ct);
        }
        catch (AmazonS3Exception ex)
        {
            // An orphaned file is not worth failing the request over.
            _logger.LogWarning(ex, "Failed to delete R2 object {Key}", key);
        }
    }

    public void Dispose() => _client.Dispose();
}
