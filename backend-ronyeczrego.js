const { log, error } = require("node:console")
const express = require("express")
const knex = require("knex")
const z = require("zod")
const app = express()
const port = 3000
app.use(express.json())

// DATABASE 
const db = knex({
    client: "mysql2",
    connection: {
        host: "localhost",
        user: "root",
        password: "",
        database:"dog_club"
    }
})

// Query Validation
const QuerySchema = z.object({
    city: z.string().optional(),
    search: z.string().optional(),
    sort: z.enum(['name', 'city', 'created_at']).default('name'),
    order: z.enum(['asc', 'desc']).default('asc'),
    limit: z.coerce.number({ error: "Invalid 'limit': must be between 1 and 100" })
        .int("Invalid 'limit': must be between 1 and 100")
        .min(1, "Invalid 'limit': must be between 1 and 100")
        .max(100, "Invalid 'limit': must be between 1 and 100")
        .default(20),
    offset: z.coerce.number({ error: "Invalid 'offset': must be greater than or equal to 0" })
        .int("Invalid 'offset': must be greater than or equal to 0")
        .min(0, "Invalid 'offset': must be greater than or equal to 0")
        .default(0)
});
// Param Validation
const ParamsSchema = z.object({
    id: z.coerce.number({ error: "Invalid 'id': must be a positive integer" })
        .int("Invalid 'id': must be a positive integer")
        .positive("Invalid 'id': must be a positive integer")
})

const DogsQuerySchema = z.object({
    is_girl: z.enum(["0", "1"], { error: "Invalid 'is_girl': must be 0 or 1" }).optional(),
    sort: z.enum(["name", "born_at", "weight_kg"], { error: "Invalid 'sort': must be name, born_at or weight_kg" })
        .default("born_at"),
    order: z.enum(["asc", "desc"], { error: "Invalid 'order': must be asc or desc" })
        .default("asc")
})

const OwnerSchema = z.object({
    name: z.string({ error: (err) => err.input === undefined ? "Field 'name' is required" : "Invalid 'name': must be a string" })
        .trim()
        .min(1, "Invalid 'name': must be 1-100 characters")
        .max(100, "Invalid 'name': must be 1-100 characters"),
    email: z.email({ error: "Invalid 'email': must be a valid email" }).optional(),
    phone: z.string({ error: "Invalid 'phone': must be a string" })
        .max(20, "Invalid 'phone': must be at most 20 characters").optional(),
    city: z.string({ error: "Invalid 'city': must be a string" })
        .max(80, "Invalid 'city': must be at most 80 characters").optional()
})


const AllDogsQuerySchema = DogsQuerySchema.extend({
    breed: z.string().optional(),
    search: QuerySchema.shape.search,
    owner_id: z.coerce.number({ error: "Invalid 'owner_id': must be a positive integer" })
        .int("Invalid 'owner_id': must be a positive integer")
        .positive("Invalid 'owner_id': must be a positive integer").optional(),
    has_owner: z.enum(["true", "false"], { error: "Invalid 'has_owner': must be true or false" }).optional(),
    min_weight: z.coerce.number({ error: "Invalid 'min_weight': must be a number" }).optional(),
    max_weight: z.coerce.number({ error: "Invalid 'max_weight': must be a number" }).optional(),
    sort: z.enum(["name", "born_at", "weight_kg"], { error: "Invalid 'sort': must be name, born_at or weight_kg" })
        .default("name"),
    limit: QuerySchema.shape.limit,
    offset: QuerySchema.shape.offset
})

//DOOOOOOOOOOOOOOOOOOOOG #####x
const DogSchema = z.object({
    name: z.string({ error: (err) => err.input === undefined ? "Field 'name' is required" : "Invalid 'name': must be a string" })
        .trim()
        .min(1, "Invalid 'name': must be 1-50 characters")
        .max(50, "Invalid 'name': must be 1-50 characters"),
    is_girl: z.boolean({ error: (err) => err.input === undefined ? "Field 'is_girl' is required" : "Invalid 'is_girl': must be true or false" }),
    born_at: z.iso.date({ error: (err) => err.input === undefined ? "Field 'born_at' is required" : "Invalid 'born_at': must be a date (YYYY-MM-DD)" })
        .refine(v => v <= new Date().toISOString().slice(0, 10), "Field 'born_at' cannot be in the future"),
    breed: z.string({ error: "Invalid 'breed': must be a string" })
        .max(60, "Invalid 'breed': must be at most 60 characters").nullable().optional(),
    weight_kg: z.number({ error: "Invalid 'weight_kg': must be a number" })
        .positive("Invalid 'weight_kg': must be greater than 0").nullable().optional(),
    color: z.string({ error: "Invalid 'color': must be a string" })
        .max(30, "Invalid 'color': must be at most 30 characters").nullable().optional(),
    adopted_at: z.iso.date({ error: "Invalid 'adopted_at': must be a date (YYYY-MM-DD) or null" }).nullable().optional(),
    owner_id: z.number({ error: "Invalid 'owner_id': must be a positive integer or null" })
        .int("Invalid 'owner_id': must be a positive integer or null")
        .positive("Invalid 'owner_id': must be a positive integer or null").nullable().optional()
})

const DogOwnerSchema = z.object({
    owner_id: z.number({ error: (err) => err.input === undefined ? "Field 'owner_id' is required" : "Invalid 'owner_id': must be a positive integer or null" })
        .int("Invalid 'owner_id': must be a positive integer or null")
        .positive("Invalid 'owner_id': must be a positive integer or null")
        .nullable()
})

const StatsQuerySchema = z.object({
    min_count: z.coerce.number({ error: "Invalid 'min_count': must be a positive integer" })
        .int("Invalid 'min_count': must be a positive integer")
        .min(1, "Invalid 'min_count': must be a positive integer")
        .default(1),
    with_owners_only: z.enum(["true", "false"], { error: "Invalid 'with_owners_only': must be true or false" }).optional()
})

// GET /health
app.get("/health", (req,res) =>{
    return res.status(200).json({status: "Healthy"})
})

// GET /api/owners
app.get("/api/owners", async (req,res) =>{
    try{
        const validation = QuerySchema.safeParse(req.query)

        if (!validation.success) {
            const first = validation.error.issues[0]?.message
            return res.status(400).json({ error: first, data: null })
        }

        const { city, search, sort, order, limit, offset } = validation.data
        
        let query = db("owners")

        if(city) query = query.where("city", city)
        if(search) query = query.where("name", "like", `%${search}%`)
        
        const totalRes = await query.clone().count({count: "*"}).first()
        const total = Number.parseInt(totalRes.count, 10)

        const items = await query.select("id", "name", "email", "phone", "city", "created_at")
        .orderBy(sort, order).limit(limit).offset(offset)

    
        return res.status(200).json({
            data:{items, total, limit, offset},
            error : null
        })

    }
    catch (error) {
        log("Database error: ", error)
        return res.status(500).json({
            data: null,
            error: "Internal server error"
        })
    }
})

// GET /api/owners/:id
app.get("/api/owners/:id", async (req,res) =>{
    try{
        const validation = ParamsSchema.safeParse(req.params)

        if (!validation.success) {
            const first = validation.error.issues[0]?.message
            return res.status(400).json({ error: first, data: null })
        }

        const owner = await db("owners").select("id", "name", "email", "phone", "city", "created_at")
        .where("id", validation.data.id)
        .first() // <-- i dont want "[]" 

        if (!owner) {
            return res.status(404).json({ error: `Owner with id ${validation.data.id} not found`, data: null })
        }

        return res.status(200).json({data: owner, error: null})
    }
    catch (error) {
        log("Database error: ", error)
        return res.status(500).json({
            data: null,
            error: "Internal server error"
        })
    }
})

//GET /api/owners/:id/dogs
app.get("/api/owners/:id/dogs", async (req, res) => {
    try {
        const params = ParamsSchema.safeParse(req.params)
        if (!params.success) {
            return res.status(400).json({ error: params.error.issues[0]?.message, data: null })
        }

        const query = DogsQuerySchema.safeParse(req.query)
        if (!query.success) {
            return res.status(400).json({ error: query.error.issues[0]?.message, data: null })
        }

        const { id } = params.data
        const { is_girl, sort, order } = query.data

        const owner = await db("owners").select("id", "name", "city").where("id", id).first()

        if (!owner) {
            return res.status(404).json({ error: `Owner with id ${id} not found`, data: null })
        }

        let dogsQuery = db("dogs")
            .select(
                "id", "name", "is_girl", "breed", "weight_kg", "color",
                db.raw("DATE_FORMAT(born_at, '%Y-%m-%d') AS born_at"), // 
                db.raw("DATE_FORMAT(adopted_at, '%Y-%m-%d') AS adopted_at")
            )
            .where("owner_id", id)

        if (is_girl !== undefined) dogsQuery = dogsQuery.where("is_girl", Number(is_girl))

        const rows = await dogsQuery.orderBy(sort, order).orderBy("id")

        const dogs = rows.map(dog => ({
            ...dog,
            is_girl: Boolean(dog.is_girl),
            weight_kg: dog.weight_kg === null ? null : Number(dog.weight_kg)
        }))

        return res.status(200).json({ data: { owner, dogs }, error: null })
    } catch (error) {
        log("Database error: ", error)
        return res.status(500).json({ data: null, error: "Internal server error" })
    }
})


// POST /api/owners
app.post("/api/owners", async (req, res) => {
    try {
        const validation = OwnerSchema.safeParse(req.body ?? {}) // "Field 'name' is required" : "Invalid 'name': must be a string" })"

        if (!validation.success) {
            const first = validation.error.issues[0]?.message
            return res.status(400).json({ error: first, data: null })
        }

        const [id] = await db("owners").insert(validation.data)
        const owner = await db("owners").select("id", "name", "email", "phone", "city", "created_at")
            .where("id", id)
            .first()

        return res.status(201).json({ data: owner, error: null })
    }
    catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ error: "Email already in use", data: null })
        }
        log("Database error: ", error)
        return res.status(500).json({ data: null, error: "Internal server error" })
    }
})

// PUT /api/owners/:id
app.put("/api/owners/:id", async (req, res) => {
    try {
        const params = ParamsSchema.safeParse(req.params)
        if (!params.success) {
            return res.status(400).json({ error: params.error.issues[0]?.message, data: null })
        }

        const body = OwnerSchema.required().safeParse(req.body ?? {}) // Field 'name' is required" : "Invalid 'name': must be a string" })
        if (!body.success) {
            return res.status(400).json({ error: body.error.issues[0]?.message, data: null })
        }

        const { id } = params.data

        const affected = await db("owners").where("id", id).update(body.data)

        if (affected === 0) {
            return res.status(404).json({ error: `Owner with id ${id} not found`, data: null })
        }

        const owner = await db("owners").select("id", "name", "email", "phone", "city", "created_at")
            .where("id", id)
            .first()

        return res.status(200).json({ data: owner, error: null })
    }
    catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ error: "Email already in use", data: null })
        }
        log("Database error: ", error)
        return res.status(500).json({ data: null, error: "Internal server error" })
    }
})

/// DELETE /api/owners/:id
app.delete("/api/owners/:id", async (req, res) => {
    try {
        const params = ParamsSchema.safeParse(req.params)
        if (!params.success) {
            return res.status(400).json({ error: params.error.issues[0]?.message, data: null })
        }

        const { id } = params.data

        const countRes = await db("dogs").where("owner_id", id).count({ count: "*" }).first()
        const dogsOrphaned = Number.parseInt(countRes.count, 10)

        const deleted = await db("owners").where("id", id).del()

        if (deleted === 0) {
            return res.status(404).json({ error: `Owner with id ${id} not found`, data: null })
        }

        return res.status(200).json({ data: { id, deleted: true, dogs_orphaned: dogsOrphaned }, error: null })
    }
    catch (error) {
        log("Database error: ", error)
        return res.status(500).json({ data: null, error: "Internal server error" })
    }
})

// DOOG section 



// GET /api/dogs
app.get("/api/dogs", async (req, res) => {
    try {
        const validation = AllDogsQuerySchema.safeParse(req.query)

        if (!validation.success) {
            const first = validation.error.issues[0]?.message
            return res.status(400).json({ error: first, data: null })
        }

        const { breed, is_girl, owner_id, has_owner, min_weight, max_weight, search, sort, order, limit, offset } = validation.data

        let query = db("dogs as d")

        if (breed) query = query.where("d.breed", breed)
        if (is_girl !== undefined) query = query.where("d.is_girl", Number(is_girl))
        if (owner_id !== undefined) query = query.where("d.owner_id", owner_id)
        if (has_owner !== undefined) query = has_owner === "true" ? query.whereNotNull("d.owner_id") : query.whereNull("d.owner_id")
        if (min_weight !== undefined) query = query.where("d.weight_kg", ">=", min_weight)
        if (max_weight !== undefined) query = query.where("d.weight_kg", "<=", max_weight)
        if (search) query = query.where("d.name", "like", `%${search}%`)

        const totalRes = await query.clone().count({ count: "*" }).first()
        const total = Number.parseInt(totalRes.count, 10)

        const rows = await query
            .select(
                "d.id", "d.name", "d.is_girl", "d.breed", "d.weight_kg", "d.color", "d.owner_id",
                db.raw("DATE_FORMAT(d.born_at, '%Y-%m-%d') AS born_at"),
                db.raw("DATE_FORMAT(d.adopted_at, '%Y-%m-%d') AS adopted_at")
            )
            .orderBy(`d.${sort}`, order).orderBy("d.id").limit(limit).offset(offset)

        const items = rows.map(dog => ({
            ...dog,
            is_girl: Boolean(dog.is_girl),
            weight_kg: dog.weight_kg === null ? null : Number(dog.weight_kg)
        }))

        return res.status(200).json({ data: { items, total, limit, offset }, error: null })
    }
    catch (error) {
        log("Database error: ", error)
        return res.status(500).json({ data: null, error: "Internal server error" })
    }
})

// GET /api/dogs/stats/by-breed
app.get("/api/dogs/stats/by-breed", async (req, res) => {
    try {
        const validation = StatsQuerySchema.safeParse(req.query)

        if (!validation.success) {
            const first = validation.error.issues[0]?.message
            return res.status(400).json({ error: first, data: null })
        }

        const { min_count, with_owners_only } = validation.data

        let query = db("dogs as d").leftJoin("owners as o", "o.id", "d.owner_id")

        if (with_owners_only === "true") query = query.whereNotNull("o.id")

        const rows = await query
            .select("d.breed")
            .select(
                db.raw("COUNT(*) AS dog_count"),
                db.raw("ROUND(AVG(d.weight_kg), 2) AS avg_weight"),
                db.raw("ROUND(AVG(TIMESTAMPDIFF(YEAR, d.born_at, CURDATE())), 1) AS avg_age_years"),
                db.raw("SUM(CASE WHEN o.id IS NOT NULL THEN 1 ELSE 0 END) AS with_owner_count")
            )
            .groupBy("d.breed")
            .havingRaw("COUNT(*) >= ?", [min_count])
            .orderBy("dog_count", "desc")
            .orderBy("d.breed")

        const breeds = rows.map(row => ({
            breed: row.breed,
            dog_count: Number(row.dog_count),
            avg_weight: row.avg_weight === null ? null : Number(row.avg_weight),
            avg_age_years: Number(row.avg_age_years),
            with_owner_count: Number(row.with_owner_count)
        }))

        return res.status(200).json({ data: { breeds, total_breeds: breeds.length }, error: null })
    }
    catch (error) {
        log("Database error: ", error)
        return res.status(500).json({ data: null, error: "Internal server error" })
    }
})

// GET /api/dogs/:id
app.get("/api/dogs/:id", async (req, res) => {
    try {
        const validation = ParamsSchema.safeParse(req.params)

        if (!validation.success) {
            const first = validation.error.issues[0]?.message
            return res.status(400).json({ error: first, data: null })
        }

        const { id } = validation.data

        const row = await db("dogs as d")
            .leftJoin("owners as o", "o.id", "d.owner_id")
            .select(
                "d.id", "d.name", "d.is_girl", "d.breed", "d.weight_kg", "d.color",
                db.raw("DATE_FORMAT(d.born_at, '%Y-%m-%d') AS born_at"),
                db.raw("DATE_FORMAT(d.adopted_at, '%Y-%m-%d') AS adopted_at"),
                db.raw("TIMESTAMPDIFF(YEAR, d.born_at, CURDATE()) AS age_years"),
                "o.id as o_id", "o.name as o_name", "o.city as o_city", "o.email as o_email"
            )
            .where("d.id", id)
            .first()

        if (!row) {
            return res.status(404).json({ error: `Dog with id ${id} not found`, data: null })
        }

        const { o_id, o_name, o_city, o_email, ...dog } = row

        return res.status(200).json({
            data: {
                ...dog,
                is_girl: Boolean(dog.is_girl),
                weight_kg: dog.weight_kg === null ? null : Number(dog.weight_kg),
                owner: o_id === null ? null : { id: o_id, name: o_name, city: o_city, email: o_email }
            },
            error: null
        })
    }
    catch (error) {
        log("Database error: ", error)
        return res.status(500).json({ data: null, error: "Internal server error" })
    }
})

// POST /api/dogs
app.post("/api/dogs", async (req, res) => {
    try {
        const validation = DogSchema.safeParse(req.body ?? {})

        if (!validation.success) {
            const first = validation.error.issues[0]?.message
            return res.status(400).json({ error: first, data: null })
        }

        const { owner_id } = validation.data

        if (owner_id != null) {
            const owner = await db("owners").select("id").where("id", owner_id).first()
            if (!owner) {
                return res.status(404).json({ error: `Owner with id ${owner_id} not found`, data: null })
            }
        }

        const [id] = await db("dogs").insert(validation.data)

        const dog = await db("dogs")
            .select(
                "id", "name", "is_girl", "breed", "weight_kg", "color", "owner_id",
                db.raw("DATE_FORMAT(born_at, '%Y-%m-%d') AS born_at"),
                db.raw("DATE_FORMAT(adopted_at, '%Y-%m-%d') AS adopted_at")
            )
            .where("id", id)
            .first()

        return res.status(201).json({
            data: {
                ...dog,
                is_girl: Boolean(dog.is_girl),
                weight_kg: dog.weight_kg === null ? null : Number(dog.weight_kg)
            },
            error: null
        })
    }
    catch (error) {
        log("Database error: ", error)
        return res.status(500).json({ data: null, error: "Internal server error" })
    }
})

// PUT /api/dogs/:id
app.put("/api/dogs/:id", async (req, res) => {
    try {
        const params = ParamsSchema.safeParse(req.params)
        if (!params.success) {
            return res.status(400).json({ error: params.error.issues[0]?.message, data: null })
        }

        const body = DogSchema.required().safeParse(req.body ?? {})
        if (!body.success) {
            return res.status(400).json({ error: body.error.issues[0]?.message, data: null })
        }

        const { id } = params.data
        const { owner_id } = body.data

        if (owner_id !== null) {
            const owner = await db("owners").select("id").where("id", owner_id).first()
            if (!owner) {
                return res.status(404).json({ error: `Owner with id ${owner_id} not found`, data: null })
            }
        }

        const affected = await db("dogs").where("id", id).update(body.data)

        if (affected === 0) {
            return res.status(404).json({ error: `Dog with id ${id} not found`, data: null })
        }

        const row = await db("dogs as d")
            .leftJoin("owners as o", "o.id", "d.owner_id")
            .select(
                "d.id", "d.name", "d.is_girl", "d.breed", "d.weight_kg", "d.color",
                db.raw("DATE_FORMAT(d.born_at, '%Y-%m-%d') AS born_at"),
                db.raw("DATE_FORMAT(d.adopted_at, '%Y-%m-%d') AS adopted_at"),
                db.raw("TIMESTAMPDIFF(YEAR, d.born_at, CURDATE()) AS age_years"),
                "o.id as o_id", "o.name as o_name", "o.city as o_city", "o.email as o_email"
            )
            .where("d.id", id)
            .first()

        const { o_id, o_name, o_city, o_email, ...dog } = row

        return res.status(200).json({
            data: {
                ...dog,
                is_girl: Boolean(dog.is_girl),
                weight_kg: dog.weight_kg === null ? null : Number(dog.weight_kg),
                owner: o_id === null ? null : { id: o_id, name: o_name, city: o_city, email: o_email }
            },
            error: null
        })
    }
    catch (error) {
        log("Database error: ", error)
        return res.status(500).json({ data: null, error: "Internal server error" })
    }
})

// PUT /api/dogs/:id/owner
app.put("/api/dogs/:id/owner", async (req, res) => {
    try {
        const params = ParamsSchema.safeParse(req.params)
        if (!params.success) {
            return res.status(400).json({ error: params.error.issues[0]?.message, data: null })
        }

        const body = DogOwnerSchema.safeParse(req.body ?? {})
        if (!body.success) {
            return res.status(400).json({ error: body.error.issues[0]?.message, data: null })
        }

        const { id } = params.data
        const { owner_id } = body.data

        const dog = await db("dogs").select("id", "owner_id").where("id", id).first()

        if (!dog) {
            return res.status(404).json({ error: `Dog with id ${id} not found`, data: null })
        }

        if (owner_id !== null) {
            const owner = await db("owners").select("id").where("id", owner_id).first()
            if (!owner) {
                return res.status(404).json({ error: `Owner with id ${owner_id} not found`, data: null })
            }
        }

        await db("dogs").where("id", id).update({ owner_id })

        return res.status(200).json({
            data: { dog_id: id, owner_id, previous_owner_id: dog.owner_id },
            error: null
        })
    }
    catch (error) {
        log("Database error: ", error)
        return res.status(500).json({ data: null, error: "Internal server error" })
    }
})

// DELETE /api/dogs/:id
app.delete("/api/dogs/:id", async (req, res) => {
    try {
        const params = ParamsSchema.safeParse(req.params)
        if (!params.success) {
            return res.status(400).json({ error: params.error.issues[0]?.message, data: null })
        }

        const { id } = params.data

        const deleted = await db("dogs").where("id", id).del()

        if (deleted === 0) {
            return res.status(404).json({ error: `Dog with id ${id} not found`, data: null })
        }

        return res.status(200).json({ data: { id, deleted: true }, error: null })
    }
    catch (error) {
        log("Database error: ", error)
        return res.status(500).json({ data: null, error: "Internal server error" })
    }
})




// ## Error thing 
app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ error: "Invalid JSON body", data: null })
    }
    log("Unexpected error: ", err)
    return res.status(500).json({ data: null, error: "Internal server error" })
})


// ## Runner ## 
app.listen(port, ()=>{
    log("Running on port: ", port)
})

