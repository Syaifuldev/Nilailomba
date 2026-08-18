const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(url, key)

async function main() {
  console.log('Fetching auth.users...')
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
  
  if (usersError) {
    console.error('Error fetching users:', usersError)
    process.exit(1)
  }

  console.log(`Found ${users.users.length} users. Updating profiles...`)

  let updated = 0
  for (const user of users.users) {
    if (user.email) {
      const { error } = await supabase
        .from('profiles')
        .update({ email: user.email })
        .eq('id', user.id)
      
      if (error) {
        console.error(`Failed to update profile for ${user.email}:`, error)
      } else {
        updated++
      }
    }
  }

  console.log(`Successfully updated ${updated} profiles with their email addresses.`)
}

main()
