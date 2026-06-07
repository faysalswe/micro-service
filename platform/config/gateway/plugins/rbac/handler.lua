local kong = kong

-- Public routes: skip JWT and RBAC entirely (no token required)
local PUBLIC_ROUTES = {
    { path = "/api/identity/login",           methods = {"POST"} },
    { path = "/api/identity/register",        methods = {"POST"} },
    { path = "/api/inventory/active-products", methods = {"GET"} },
    { path = "/api/inventory/offer",           methods = {"GET"} },
}

-- Route access table: path + optional methods → roles allowed.
-- methods omitted  → matches any HTTP method
-- roles = "*"      → any authenticated user (JWT already validated by Kong)
-- roles = {...}    → only listed roles; anyone else gets 403
-- no entry         → open to all authenticated
local ROUTES = {
    -- Inventory: writes Admin only; stock-out open to all authenticated (no entry needed)
    { path = "/api/inventory/active-products", methods = {"POST","PUT","DELETE"}, roles = {"Admin"} },

    -- Identity: user management Admin only
    { path = "/api/identity/users",                                               roles = {"Admin"} },

    -- Orders: cancel Admin/Manager only; GET open to all authenticated
    { path = "/api/orders",                    methods = {"DELETE"},              roles = {"Admin","Manager"} },

    -- Payments: list-all Admin/Manager only (exact match); GET /{id} open to all authenticated
    { path = "/api/payments",                  methods = {"GET"}, exact = true,   roles = {"Admin","Manager"} },

    -- PDF: invoice generation back-office only
    { path = "/api/pdf/generate/invoice",      methods = {"POST"},               roles = {"Admin","Manager"} },
}

local RbacHandler = {
    PRIORITY = 900,  -- runs after jwt (1005) which populates authenticated_jwt_token
    VERSION  = "1.0.0",
}

local function method_matches(route_methods, method)
    if not route_methods then return true end
    for _, m in ipairs(route_methods) do
        if m == method then return true end
    end
    return false
end

local function is_public(path, method)
    for _, route in ipairs(PUBLIC_ROUTES) do
        local path_match = path == route.path or path:sub(1, #route.path + 1) == route.path .. "/"
        if path_match and method_matches(route.methods, method) then
            return true
        end
    end
    return false
end

local function is_allowed(role, path, method)
    for _, route in ipairs(ROUTES) do
        local path_match   = path == route.path or
                             (not route.exact and path:sub(1, #route.path + 1) == route.path .. "/")
        local method_match = method_matches(route.methods, method)
        if path_match and method_match then
            if route.roles == "*" then return true end
            for _, r in ipairs(route.roles) do
                if r == role then return true end
            end
            return false
        end
    end
    return true  -- no entry = open to all authenticated
end

function RbacHandler:access()
    local path   = kong.request.get_path()
    local method = kong.request.get_method()

    if is_public(path, method) then return end

    local token = kong.ctx.shared.authenticated_jwt_token
    if not token then
        return kong.response.exit(401, { message = "Unauthorized" })
    end

    local role = token.claims and token.claims.role or ""

    if not is_allowed(role, path, method) then
        return kong.response.exit(403, { message = "Forbidden: role '" .. role .. "' cannot access " .. path })
    end
end

return RbacHandler
