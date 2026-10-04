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




// ## Runner ## 
app.listen(port, ()=>{
    log("Running on port: ", port)
})

