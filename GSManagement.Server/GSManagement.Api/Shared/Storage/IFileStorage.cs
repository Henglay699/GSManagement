namespace GSManagement.Api.Shared.Storage;

public interface IFileStorage
{
    // Uploads the stream under the given key and returns its public URL.
    Task<string> UploadAsync(Stream content, string key, string contentType, CancellationToken ct);

    // Deletes the file behind a URL previously returned by UploadAsync.
    // URLs that don't belong to this storage are ignored.
    Task DeleteByUrlAsync(string? url, CancellationToken ct);
}
