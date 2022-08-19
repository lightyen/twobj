import { resolveConfig } from "../config/resolveConfig"
import { createContext } from "../core"
const context = createContext(resolveConfig())
export default context
