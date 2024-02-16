import { addIsAdminFlagInGroupCreators } from './seed/addIsAdminFlagInGroupCreators'
import { createCodeRequestTypes } from './seed/codeRequestType'
import { createEssentialTerms } from './seed/terms'

async function run() {
  await createCodeRequestTypes()
  await createEssentialTerms()
  await addIsAdminFlagInGroupCreators()
}

run()
