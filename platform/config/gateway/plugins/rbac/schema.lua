local typedefs = require "kong.db.schema.typedefs"

return {
    name   = "rbac",
    fields = {
        { protocols = typedefs.protocols_http },
        { config    = { type = "record", fields = {} } },
    },
}
