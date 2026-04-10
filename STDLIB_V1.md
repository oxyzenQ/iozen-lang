# IOZEN Standard Library v1

## Design Philosophy

> **Minimal but complete for real tasks**

- Small surface area (avoid bloat)
- Every function must solve real problem
- Consistent naming convention
- Type-safe by default

---

## v1 API Reference

### String Operations

```iozen
len(s)              # Get length of string or list
to_string(x)        # Convert any value to string
substr(s, start, end)  # Extract substring (inclusive start, exclusive end)
contains(s, sub)    # Check if string contains substring
split(s, sep)       # Split string by separator → list
join(list, sep)     # Join list with separator → string
trim(s)             # Remove whitespace from both ends
upper(s)            # Convert to uppercase
lower(s)            # Convert to lowercase
starts_with(s, prefix)  # Check prefix
ends_with(s, suffix)    # Check suffix
```

### File I/O

```iozen
read_file(path)     # Read entire file → text
write_file(path, content)  # Write text to file
file_exists(path)   # Check if file exists → boolean
delete_file(path)   # Delete file
```

### List Operations

```iozen
len(list)           # Get list length
append(list, item)  # Add item to end
pop(list)           # Remove and return last item
get(list, index)    # Get item at index (with bounds check)
```

### Type Conversion

```iozen
to_integer(s)       # Parse string → integer
to_float(s)         # Parse string → float
```

---

## Implementation Strategy

### Registry Pattern (TypeScript)

```typescript
const BUILTINS: Record<string, (args: IOZENValue[]) => IOZENValue> = {
  len: (args) => {
    const v = args[0];
    if (typeof v === 'string') return v.length;
    if (Array.isArray(v)) return v.length;
    throw new Error("len() expects string or list");
  },
  
  read_file: (args) => {
    const path = String(args[0]);
    // Node.js fs.readFileSync
    return fs.readFileSync(path, 'utf-8');
  },
  
  // ... more functions
};
```

### Error Handling

- File not found → clear error message
- Type mismatch → specific error
- Bounds error → helpful context

---

## Use Cases Enabled

### 1. Config File Reader

```iozen
function read_config with path as text returns text
    when file_exists(path) do
        return read_file(path)
    end
    return "{}"
end
```

### 2. Log Processor

```iozen
function process_log with path as text returns integer
    create variable content as text with value read_file(path)
    create variable lines as list with value split(content, "\n")
    
    create variable count as integer with value 0
    for each line in lines do
        when contains(line, "ERROR") do
            increase count by 1
        end
    end
    
    return count
end
```

### 3. Text Transformer

```iozen
function transform_file with input_path as text and output_path as text returns integer
    create variable content as text with value read_file(input_path)
    create variable upper as text with value upper(content)
    create variable trimmed as text with value trim(upper)
    
    write_file(output_path, trimmed)
    return 0
end
```

---

## Future Extensions (v2)

- `json_parse(text)` / `json_stringify(value)`
- `http_get(url)` / `http_post(url, body)`
- `regex_match(pattern, text)`
- `date_now()` / `date_format(timestamp, format)`
- `random()` / `random_int(min, max)`

---

## Migration Path

v1 → v2 will be backward compatible.
All v1 functions remain in v2.

---

## Test Strategy

Each function needs:
1. Happy path test
2. Edge case test
3. Error case test

---

**Status: Design Complete → Ready for Implementation**
