const { log, error } = require("node:console")
const express = require("express")
const knex = require("knex")
const z = require("zod")
const app = express()
const port = 3000

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
            return res.status(404).json({ error: "Owner not found", data: null })
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


// ## Runner ## 
app.listen(port, ()=>{
    log("Running on port: ", port)
})

