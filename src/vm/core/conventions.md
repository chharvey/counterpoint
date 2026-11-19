# Conventions



## Import Module Paths
An import module path starting with `./` or `../` refers to a file in the file system and uses Unix-standard file paths.
The file extension `.cplm` is left off and assumed, as only CPL Modules (CPLM) may be imported.
```cpl
from "./my-module" import (Component); % refers to `./my-module.cplm`
```

When the module path starts with `core/`, it refers to a Core module.
- `from "core/vm" import ...` for virtual machine exports
- `from "core/lib" import ...` for Core Library components



## Hooks
Some class members are not meant to be called directly by a user;
they are only used in Core Library files, but are still exposed publicly for overriding.
These members have names in the format `'%%‹name›%%'`.
The surrounding `%%` symbols indicate the method is to be used only as a hook.
```cpl
public class abstract Object {
	%%% A hook used internally in the `String()` constructor. %%%
	public abstract '%%toString%%'(): str;
}
```
