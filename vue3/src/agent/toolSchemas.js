export const AGENT_TOOL_SCHEMAS = Object.freeze({
  navigate_to: {
    name: 'navigate_to',
    category: 'navigation',
    description: 'Open a public page.',
    inputSchema: {
      type: 'object',
      required: ['destination'],
      properties: {
        destination: {
          type: 'string',
          enum: ['home', 'heritage', 'inheritor', 'activity', 'course', 'shop', 'ai-chat', '3dlist', 'trail', 'quiz']
        }
      }
    },
    outputSchema: { type: 'object', properties: { path: { type: 'string' }, message: { type: 'string' } } }
  },
  search_product: {
    name: 'search_product',
    category: 'shop',
    description: 'Search shop products.',
    inputSchema: {
      type: 'object',
      required: ['keyword'],
      properties: {
        keyword: { type: 'string' },
        quantity: { type: 'number', minimum: 1, maximum: 99 }
      }
    },
    outputSchema: { type: 'object', properties: { keyword: { type: 'string' }, quantity: { type: 'number' } } }
  },
  search_heritage: {
    name: 'search_heritage',
    category: 'heritage',
    description: 'Search heritage artifacts.',
    inputSchema: {
      type: 'object',
      required: ['keyword'],
      properties: {
        keyword: { type: 'string' }
      }
    },
    outputSchema: { type: 'object', properties: { keyword: { type: 'string' }, message: { type: 'string' } } }
  },
  control_trail: {
    name: 'control_trail',
    category: 'trail',
    description: 'Control spacetime trail.',
    inputSchema: {
      type: 'object',
      required: ['action'],
      properties: {
        action: {
          type: 'string',
          enum: ['open_artifact', 'select_pit', 'go_scene_one', 'go_artifact_list', 'open_stage', 'open_guide', 'focus_graph', 'start_quiz']
        },
        artifact_id: { type: 'string' },
        pit_code: { type: 'string' },
        graph_target: { type: 'string' }
      }
    },
    outputSchema: { type: 'object', properties: { silent: { type: 'boolean' }, message: { type: 'string' } } }
  },
  get_weather: {
    name: 'get_weather',
    category: 'info',
    description: 'Get real-time weather for a city.',
    inputSchema: {
      type: 'object',
      required: ['city'],
      properties: {
        city: { type: 'string' }
      }
    },
    outputSchema: { type: 'object', properties: { city: { type: 'string' }, summary: { type: 'string' } } }
  },
  get_current_datetime: {
    name: 'get_current_datetime',
    category: 'info',
    description: 'Get current Beijing date, weekday, and time.',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    outputSchema: { type: 'object', properties: { isoDateTime: { type: 'string' }, message: { type: 'string' } } }
  },
  open_artifact_detail: {
    name: 'open_artifact_detail',
    category: 'heritage',
    description: 'Open artifact detail page.',
    inputSchema: {
      type: 'object',
      required: ['artifact_id'],
      properties: {
        artifact_id: { type: 'string' },
        auto_explain: { type: 'boolean' }
      }
    },
    outputSchema: { type: 'object', properties: { artifact_id: { type: 'string' }, message: { type: 'string' } } }
  },
  play_voice_intro: {
    name: 'play_voice_intro',
    category: 'audio',
    description: 'Play voice introduction for an artifact.',
    inputSchema: {
      type: 'object',
      required: ['artifact_id'],
      properties: {
        artifact_id: { type: 'string' },
        voice_type: { type: 'string', enum: ['normal', 'warm', 'lively'] }
      }
    },
    outputSchema: { type: 'object', properties: { artifact_id: { type: 'string' }, message: { type: 'string' } } }
  }
})

export function getAgentToolNames() {
  return Object.keys(AGENT_TOOL_SCHEMAS)
}

export function getAgentToolSchema(name) {
  return AGENT_TOOL_SCHEMAS[name] || null
}
