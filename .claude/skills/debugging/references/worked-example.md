# Worked Example

> Symptom: app restarts specifically when a customer uploads an image, not on other actions.

```tsx
// Before — full-resolution image decoded synchronously on the JS thread for a preview
function ImagePreview({ uri }: { uri: string }) {
  const [base64, setBase64] = useState('');
  useEffect(() => {
    RNFS.readFile(uri, 'base64').then(setBase64); // reads the full original file into memory
  }, [uri]);
  return <Image source={{ uri: `data:image/jpeg;base64,${base64}` }} style={{ width: 80, height: 80 }} />;
}
```

### Fix
`RNFS.readFile(uri, 'base64')` loads the entire original-resolution file (uncompressed in
memory as a base64 string, ~33% larger than the file itself) just to render an 80×80 preview.
On a large camera photo this spikes memory enough to trigger an OOM restart — this is a memory
usage issue caused by decoding full resolution for a thumbnail-sized render target, not a
general "large file" problem. Fix: request a downscaled preview instead of reading the raw
file.

### Corrected Code
```tsx
useEffect(() => {
  ImageResizer.createResizedImage(uri, 80, 80, 'JPEG', 80).then((r) => setUri(r.uri));
}, [uri]);
```

If the actual code doesn't show an equivalent full-resolution read (e.g. the image is already
being resized before this point), that rules this mechanism out — don't apply this fix
speculatively; find what the real code does at the point where memory would spike.

## Why This Is the Format to Follow

Notice what the fix does *not* do: it doesn't touch how the image is uploaded, doesn't add a
generic "compress all images" utility used nowhere else yet, and doesn't wrap the component in
a try/catch to "handle" the crash. It changes exactly the operation identified as the cause.
That's the bar for every fix produced by this skill — traceable from symptom, to exact line, to
mechanism, to minimal correction.
