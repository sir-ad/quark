import Cocoa

let pb = NSPasteboard.general
if let types = pb.types {
    print("Available types: \(types.map { $0.rawValue })")
    for type in types {
        if type.rawValue.lowercased().contains("html") {
            if let string = pb.string(forType: type) {
                print("\n--- STRING CONTENT FOR \(type.rawValue) ---")
                // Only print first 1000 chars to avoid terminal spam
                let maxLen = min(string.count, 1000)
                let start = string.startIndex
                let end = string.index(start, offsetBy: maxLen)
                print(String(string[start..<end]))
                print("... (truncated)")
            } else if let data = pb.data(forType: type) {
                print("\n--- DATA CONTENT FOR \(type.rawValue): \(data.count) bytes ---")
                if let str = String(data: data, encoding: .utf8) {
                    let maxLen = min(str.count, 1000)
                    let start = str.startIndex
                    let end = str.index(start, offsetBy: maxLen)
                    print(String(str[start..<end]))
                    print("... (truncated)")
                }
            }
        }
    }
} else {
    print("No types found on pasteboard.")
}
