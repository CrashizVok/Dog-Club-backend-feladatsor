curl -s -w ' -> %{http_code}\n' http://localhost:3000/health

curl -s -w ' -> %{http_code}\n' -X POST http://localhost:3000/api/owners -H 'Content-Type: application/json' -d '{"name":"Molnár Péter","email":"peter.molnar@example.hu","phone":"+36 30 123 4567","city":"Szolnok"}'
curl -s -w ' -> %{http_code}\n' -X POST http://localhost:3000/api/owners -H 'Content-Type: application/json' -d '{"name":"Csak Név","city":"Szolnok"}'
curl -s -w ' -> %{http_code}\n' -X POST http://localhost:3000/api/owners -H 'Content-Type: application/json' -d '{"email":"x@example.hu"}'
curl -s -w ' -> %{http_code}\n' -X POST http://localhost:3000/api/owners -H 'Content-Type: application/json' -d '{"name":""}'
curl -s -w ' -> %{http_code}\n' -X POST http://localhost:3000/api/owners -H 'Content-Type: application/json' -d '{"name":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}'
curl -s -w ' -> %{http_code}\n' -X POST http://localhost:3000/api/owners -H 'Content-Type: application/json' -d '{"name":"x","email":"nem-email"}'
curl -s -w ' -> %{http_code}\n' -X POST http://localhost:3000/api/owners -H 'Content-Type: application/json' -d '{"name":"x","phone":"111111111111111111111"}'
curl -s -w ' -> %{http_code}\n' -X POST http://localhost:3000/api/owners -H 'Content-Type: application/json' -d '{"name":"x","city":"ccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"}'
curl -s -w ' -> %{http_code}\n' -X POST http://localhost:3000/api/owners -H 'Content-Type: application/json' -d '{"name":"x","email":"peter.molnar@example.hu"}'
curl -s -w ' -> %{http_code}\n' -X POST http://localhost:3000/api/owners -H 'Content-Type: application/json' -d '{"name":'

curl -s -w ' -> %{http_code}\n' 'http://localhost:3000/api/owners'
curl -s -w ' -> %{http_code}\n' 'http://localhost:3000/api/owners?city=Szolnok'
curl -s -w ' -> %{http_code}\n' 'http://localhost:3000/api/owners?search=Mol'
curl -s -w ' -> %{http_code}\n' 'http://localhost:3000/api/owners?sort=city&order=desc'
curl -s -w ' -> %{http_code}\n' 'http://localhost:3000/api/owners?sort=created_at&order=asc'
curl -s -w ' -> %{http_code}\n' 'http://localhost:3000/api/owners?limit=1&offset=1'
curl -s -w ' -> %{http_code}\n' 'http://localhost:3000/api/owners?limit=0'
curl -s -w ' -> %{http_code}\n' 'http://localhost:3000/api/owners?limit=101'
curl -s -w ' -> %{http_code}\n' 'http://localhost:3000/api/owners?limit=abc'
curl -s -w ' -> %{http_code}\n' 'http://localhost:3000/api/owners?offset=-1'
curl -s -w ' -> %{http_code}\n' 'http://localhost:3000/api/owners?sort=foo'
curl -s -w ' -> %{http_code}\n' 'http://localhost:3000/api/owners?order=foo'

curl -s -w ' -> %{http_code}\n' http://localhost:3000/api/owners/1
curl -s -w ' -> %{http_code}\n' http://localhost:3000/api/owners/999999
curl -s -w ' -> %{http_code}\n' http://localhost:3000/api/owners/abc
curl -s -w ' -> %{http_code}\n' http://localhost:3000/api/owners/0
curl -s -w ' -> %{http_code}\n' http://localhost:3000/api/owners/-5

curl -s -w ' -> %{http_code}\n' http://localhost:3000/api/owners/1/dogs
curl -s -w ' -> %{http_code}\n' 'http://localhost:3000/api/owners/1/dogs?is_girl=1'
curl -s -w ' -> %{http_code}\n' 'http://localhost:3000/api/owners/1/dogs?is_girl=0'
curl -s -w ' -> %{http_code}\n' 'http://localhost:3000/api/owners/1/dogs?sort=weight_kg&order=desc'
curl -s -w ' -> %{http_code}\n' 'http://localhost:3000/api/owners/1/dogs?sort=name&order=asc'
curl -s -w ' -> %{http_code}\n' 'http://localhost:3000/api/owners/1/dogs?is_girl=2'
curl -s -w ' -> %{http_code}\n' 'http://localhost:3000/api/owners/1/dogs?sort=foo'
curl -s -w ' -> %{http_code}\n' 'http://localhost:3000/api/owners/1/dogs?order=foo'
curl -s -w ' -> %{http_code}\n' http://localhost:3000/api/owners/999999/dogs
curl -s -w ' -> %{http_code}\n' http://localhost:3000/api/owners/abc/dogs

curl -s -w ' -> %{http_code}\n' -X PUT http://localhost:3000/api/owners/1 -H 'Content-Type: application/json' -d '{"name":"Kovács Béla","email":"bela.kovacs@example.hu","phone":"+36 30 111 2233","city":"Hódmezővásárhely"}'
curl -s -w ' -> %{http_code}\n' -X PUT http://localhost:3000/api/owners/1 -H 'Content-Type: application/json' -d '{"email":"a@example.hu","phone":"1","city":"c"}'
curl -s -w ' -> %{http_code}\n' -X PUT http://localhost:3000/api/owners/1 -H 'Content-Type: application/json' -d '{"name":"x","email":"a@example.hu","city":"c"}'
curl -s -w ' -> %{http_code}\n' -X PUT http://localhost:3000/api/owners/1 -H 'Content-Type: application/json' -d '{"name":"x","phone":"1","city":"c"}'
curl -s -w ' -> %{http_code}\n' -X PUT http://localhost:3000/api/owners/1 -H 'Content-Type: application/json' -d '{"name":"x","email":"nem-email","phone":"1","city":"c"}'
curl -s -w ' -> %{http_code}\n' -X PUT http://localhost:3000/api/owners/2 -H 'Content-Type: application/json' -d '{"name":"x","email":"bela.kovacs@example.hu","phone":"1","city":"c"}'
curl -s -w ' -> %{http_code}\n' -X PUT http://localhost:3000/api/owners/999999 -H 'Content-Type: application/json' -d '{"name":"x","email":"nincs@example.hu","phone":"1","city":"c"}'
curl -s -w ' -> %{http_code}\n' -X PUT http://localhost:3000/api/owners/abc -H 'Content-Type: application/json' -d '{"name":"x","email":"nincs@example.hu","phone":"1","city":"c"}'

curl -s -w ' -> %{http_code}\n' -X DELETE http://localhost:3000/api/owners/abc
curl -s -w ' -> %{http_code}\n' -X DELETE http://localhost:3000/api/owners/999999
curl -s -w ' -> %{http_code}\n' -X DELETE http://localhost:3000/api/owners/1
curl -s -w ' -> %{http_code}\n' http://localhost:3000/api/owners/1