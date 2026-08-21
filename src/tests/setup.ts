import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { afterEach } from 'vitest'
import { cleanup, configure } from '@testing-library/react'
import { _resetDBForTests } from '../data/db'

// The tutor route and the sample report page are React.lazy chunks (see
// App.tsx), so a `findBy*`/`waitFor` that crosses into either has to wait on
// a real dynamic import resolving, not just a re-render. The default 1000ms
// is fine in isolation but flakes under a full parallel test run, so this
// gives every async query room without touching individual call sites.
configure({ asyncUtilTimeout: 5000 })

// Reset DOM + memoised IndexedDB connection between tests.
afterEach(() => {
  cleanup()
  _resetDBForTests()
})
