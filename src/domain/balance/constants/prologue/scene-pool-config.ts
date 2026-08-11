import type { PrologueScenePoolEntry, PrologueSceneStage } from '@/domain/prologue/prologue.types'

/** Маппинг childhood eventId → tag deltas (skillChanges игнорируются runner'ом). */
export const PROLOGUE_SCENE_POOL: PrologueScenePoolEntry[] = [
  {
    "eventId": "infant_first_smile",
    "stage": "infant",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "social": 2
        },
        "memoryId": "infant_mem_0"
      },
      {
        "tagDeltas": {
          "curiosity": 1
        }
      }
    ]
  },
  {
    "eventId": "infant_hungry_cry",
    "stage": "infant",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "curiosity": 2
        }
      },
      {
        "tagDeltas": {
          "discipline": 1
        }
      }
    ]
  },
  {
    "eventId": "infant_stranger_fear",
    "stage": "infant",
    "weightType": "formative",
    "choices": [
      {
        "tagDeltas": {
          "social": 2
        }
      },
      {
        "tagDeltas": {
          "body": 1
        }
      }
    ]
  },
  {
    "eventId": "infant_first_steps",
    "stage": "infant",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "social": 2
        }
      },
      {
        "tagDeltas": {
          "curiosity": 1
        }
      }
    ]
  },
  {
    "eventId": "infant_first_word",
    "stage": "infant",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "curiosity": 2
        }
      },
      {
        "tagDeltas": {
          "discipline": 1
        }
      },
      {
        "tagDeltas": {
          "curiosity": 1
        }
      }
    ]
  },
  {
    "eventId": "infant_music_reaction",
    "stage": "infant",
    "weightType": "formative",
    "choices": [
      {
        "tagDeltas": {
          "social": 2
        }
      },
      {
        "tagDeltas": {
          "body": 1
        }
      }
    ]
  },
  {
    "eventId": "infant_building_blocks",
    "stage": "infant",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "social": 2
        },
        "memoryId": "infant_mem_6"
      },
      {
        "tagDeltas": {
          "curiosity": 1
        }
      }
    ]
  },
  {
    "eventId": "infant_first_drawing",
    "stage": "infant",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "curiosity": 2
        }
      },
      {
        "tagDeltas": {
          "discipline": 1
        }
      }
    ]
  },
  {
    "eventId": "preschool_fight_for_toy",
    "stage": "preschool",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "social": 2
        },
        "optionalTraitId": "curious",
        "memoryId": "preschool_mem_0"
      },
      {
        "tagDeltas": {
          "discipline": 1
        }
      },
      {
        "tagDeltas": {
          "social": 1
        }
      }
    ]
  },
  {
    "eventId": "preschool_share_cookies",
    "stage": "preschool",
    "weightType": "formative",
    "choices": [
      {
        "tagDeltas": {
          "creative": 2
        }
      },
      {
        "tagDeltas": {
          "curiosity": 1
        }
      }
    ]
  },
  {
    "eventId": "preschool_poem_concert",
    "stage": "preschool",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "social": 2
        }
      },
      {
        "tagDeltas": {
          "body": 1
        }
      }
    ]
  },
  {
    "eventId": "preschool_protect_small",
    "stage": "preschool",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "social": 2
        }
      },
      {
        "tagDeltas": {
          "discipline": 1
        }
      },
      {
        "tagDeltas": {
          "social": 1
        }
      }
    ]
  },
  {
    "eventId": "preschool_eternal_question",
    "stage": "preschool",
    "weightType": "formative",
    "choices": [
      {
        "tagDeltas": {
          "creative": 2
        }
      },
      {
        "tagDeltas": {
          "curiosity": 1
        }
      }
    ]
  },
  {
    "eventId": "preschool_fear_dark",
    "stage": "preschool",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "social": 2
        },
        "optionalTraitId": "curious"
      },
      {
        "tagDeltas": {
          "body": 1
        }
      },
      {
        "tagDeltas": {
          "social": 1
        }
      }
    ]
  },
  {
    "eventId": "preschool_lie_broken_vase",
    "stage": "preschool",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "social": 2
        },
        "memoryId": "preschool_mem_6"
      },
      {
        "tagDeltas": {
          "discipline": 1
        }
      },
      {
        "tagDeltas": {
          "social": 1
        }
      }
    ]
  },
  {
    "eventId": "preschool_best_friend",
    "stage": "preschool",
    "weightType": "formative",
    "choices": [
      {
        "tagDeltas": {
          "creative": 2
        }
      },
      {
        "tagDeltas": {
          "curiosity": 1
        }
      }
    ]
  },
  {
    "eventId": "preschool_drawing_contest",
    "stage": "preschool",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "social": 2
        }
      },
      {
        "tagDeltas": {
          "body": 1
        }
      }
    ]
  },
  {
    "eventId": "preschool_parent_praise",
    "stage": "preschool",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "social": 2
        }
      },
      {
        "tagDeltas": {
          "discipline": 1
        }
      }
    ]
  },
  {
    "eventId": "preschool_new_kid",
    "stage": "preschool",
    "weightType": "formative",
    "choices": [
      {
        "tagDeltas": {
          "creative": 2
        },
        "optionalTraitId": "curious"
      },
      {
        "tagDeltas": {
          "curiosity": 1
        }
      }
    ]
  },
  {
    "eventId": "preschool_fairytale",
    "stage": "preschool",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "social": 2
        }
      },
      {
        "tagDeltas": {
          "body": 1
        }
      }
    ]
  },
  {
    "eventId": "school_math_teacher",
    "stage": "school",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "stem": 2
        },
        "optionalTraitId": "disciplined",
        "memoryId": "school_mem_0"
      },
      {
        "tagDeltas": {
          "discipline": 1
        }
      },
      {
        "tagDeltas": {
          "stem": 1
        }
      }
    ]
  },
  {
    "eventId": "school_homework",
    "stage": "school",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "lingua": 2
        }
      },
      {
        "tagDeltas": {
          "curiosity": 1
        }
      }
    ]
  },
  {
    "eventId": "school_read_book",
    "stage": "school",
    "weightType": "formative",
    "choices": [
      {
        "tagDeltas": {
          "social": 2
        }
      },
      {
        "tagDeltas": {
          "discipline": 1
        }
      }
    ]
  },
  {
    "eventId": "school_club_join",
    "stage": "school",
    "weightType": "fateful",
    "choices": [
      {
        "tagDeltas": {
          "creative": 2
        }
      },
      {
        "tagDeltas": {
          "social": 1
        }
      },
      {
        "tagDeltas": {
          "creative": 1
        }
      }
    ]
  },
  {
    "eventId": "school_science_fair",
    "stage": "school",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "practical": 2
        }
      },
      {
        "tagDeltas": {
          "discipline": 1
        }
      },
      {
        "tagDeltas": {
          "practical": 1
        }
      }
    ]
  },
  {
    "eventId": "school_win_competition",
    "stage": "school",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "stem": 2
        }
      },
      {
        "tagDeltas": {
          "discipline": 1
        }
      }
    ]
  },
  {
    "eventId": "school_music_lesson",
    "stage": "school",
    "weightType": "formative",
    "choices": [
      {
        "tagDeltas": {
          "lingua": 2
        },
        "memoryId": "school_mem_6"
      },
      {
        "tagDeltas": {
          "curiosity": 1
        }
      }
    ]
  },
  {
    "eventId": "school_report_card",
    "stage": "school",
    "weightType": "fateful",
    "choices": [
      {
        "tagDeltas": {
          "social": 2
        },
        "optionalTraitId": "disciplined"
      },
      {
        "tagDeltas": {
          "discipline": 1
        }
      }
    ]
  },
  {
    "eventId": "school_summer_camp",
    "stage": "school",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "creative": 2
        }
      },
      {
        "tagDeltas": {
          "social": 1
        }
      }
    ]
  },
  {
    "eventId": "school_friend_neighbor",
    "stage": "school",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "practical": 2
        }
      },
      {
        "tagDeltas": {
          "discipline": 1
        }
      }
    ]
  },
  {
    "eventId": "school_bad_grade_cry",
    "stage": "school",
    "weightType": "formative",
    "choices": [
      {
        "tagDeltas": {
          "stem": 2
        }
      },
      {
        "tagDeltas": {
          "discipline": 1
        }
      }
    ]
  },
  {
    "eventId": "school_first_money",
    "stage": "school",
    "weightType": "fateful",
    "choices": [
      {
        "tagDeltas": {
          "lingua": 2
        }
      },
      {
        "tagDeltas": {
          "curiosity": 1
        }
      }
    ]
  },
  {
    "eventId": "school_bike",
    "stage": "school",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "social": 2
        },
        "memoryId": "school_mem_12"
      },
      {
        "tagDeltas": {
          "discipline": 1
        }
      }
    ]
  },
  {
    "eventId": "school_collection",
    "stage": "school",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "creative": 2
        }
      },
      {
        "tagDeltas": {
          "social": 1
        }
      }
    ]
  },
  {
    "eventId": "school_skip_classes",
    "stage": "school",
    "weightType": "formative",
    "choices": [
      {
        "tagDeltas": {
          "practical": 2
        },
        "optionalTraitId": "disciplined"
      },
      {
        "tagDeltas": {
          "discipline": 1
        }
      }
    ]
  },
  {
    "eventId": "school_bully_witness",
    "stage": "school",
    "weightType": "fateful",
    "choices": [
      {
        "tagDeltas": {
          "stem": 2
        }
      },
      {
        "tagDeltas": {
          "discipline": 1
        }
      },
      {
        "tagDeltas": {
          "stem": 1
        }
      }
    ]
  },
  {
    "eventId": "teen_start_sport",
    "stage": "tech",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "practical": 2
        },
        "optionalTraitId": "organized",
        "memoryId": "tech_mem_0"
      },
      {
        "tagDeltas": {
          "discipline": 1
        }
      }
    ]
  },
  {
    "eventId": "teen_new_hobby",
    "stage": "tech",
    "weightType": "formative",
    "choices": [
      {
        "tagDeltas": {
          "practical": 2
        }
      },
      {
        "tagDeltas": {
          "stem": 1
        }
      }
    ]
  },
  {
    "eventId": "teen_exam_stress",
    "stage": "tech",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "body": 2
        }
      },
      {
        "tagDeltas": {
          "discipline": 1
        }
      }
    ]
  },
  {
    "eventId": "young_first_job",
    "stage": "tech",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "practical": 2
        }
      },
      {
        "tagDeltas": {
          "discipline": 1
        }
      }
    ]
  },
  {
    "eventId": "young_mentor",
    "stage": "tech",
    "weightType": "formative",
    "choices": [
      {
        "tagDeltas": {
          "practical": 2
        },
        "optionalTraitId": "organized"
      },
      {
        "tagDeltas": {
          "stem": 1
        }
      }
    ]
  },
  {
    "eventId": "young_volunteer",
    "stage": "tech",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "body": 2
        }
      },
      {
        "tagDeltas": {
          "discipline": 1
        }
      }
    ]
  },
  {
    "eventId": "young_career_choice",
    "stage": "tech",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "practical": 2
        },
        "memoryId": "tech_mem_6"
      },
      {
        "tagDeltas": {
          "discipline": 1
        }
      },
      {
        "tagDeltas": {
          "practical": 1
        }
      }
    ]
  },
  {
    "eventId": "young_exam_cheating",
    "stage": "tech",
    "weightType": "formative",
    "choices": [
      {
        "tagDeltas": {
          "practical": 2
        }
      },
      {
        "tagDeltas": {
          "stem": 1
        }
      }
    ]
  },
  {
    "eventId": "young_first_salary",
    "stage": "tech",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "body": 2
        },
        "optionalTraitId": "organized"
      },
      {
        "tagDeltas": {
          "discipline": 1
        }
      }
    ]
  },
  {
    "eventId": "young_driving_license",
    "stage": "tech",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "practical": 2
        }
      },
      {
        "tagDeltas": {
          "discipline": 1
        }
      }
    ]
  },
  {
    "eventId": "young_move_out",
    "stage": "tech",
    "weightType": "formative",
    "choices": [
      {
        "tagDeltas": {
          "practical": 2
        }
      },
      {
        "tagDeltas": {
          "stem": 1
        }
      }
    ]
  },
  {
    "eventId": "young_party_mistake",
    "stage": "tech",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "body": 2
        }
      },
      {
        "tagDeltas": {
          "discipline": 1
        }
      }
    ]
  },
  {
    "eventId": "young_university_decision",
    "stage": "uni",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "stem": 2
        },
        "optionalTraitId": "curious",
        "memoryId": "uni_mem_0"
      },
      {
        "tagDeltas": {
          "curiosity": 1
        }
      }
    ]
  },
  {
    "eventId": "young_dream_job",
    "stage": "uni",
    "weightType": "formative",
    "choices": [
      {
        "tagDeltas": {
          "lingua": 2
        }
      },
      {
        "tagDeltas": {
          "social": 1
        }
      }
    ]
  },
  {
    "eventId": "young_existential",
    "stage": "uni",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "stem": 2
        }
      },
      {
        "tagDeltas": {
          "discipline": 1
        }
      }
    ]
  },
  {
    "eventId": "young_best_teachers_word",
    "stage": "uni",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "stem": 2
        }
      },
      {
        "tagDeltas": {
          "curiosity": 1
        }
      }
    ]
  },
  {
    "eventId": "teen_diary",
    "stage": "uni",
    "weightType": "formative",
    "choices": [
      {
        "tagDeltas": {
          "lingua": 2
        },
        "optionalTraitId": "curious"
      },
      {
        "tagDeltas": {
          "social": 1
        }
      }
    ]
  },
  {
    "eventId": "teen_parent_conflict",
    "stage": "uni",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "stem": 2
        }
      },
      {
        "tagDeltas": {
          "discipline": 1
        }
      }
    ]
  },
  {
    "eventId": "teen_social_media",
    "stage": "uni",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "stem": 2
        },
        "memoryId": "uni_mem_6"
      },
      {
        "tagDeltas": {
          "curiosity": 1
        }
      }
    ]
  },
  {
    "eventId": "teen_bully_witness",
    "stage": "uni",
    "weightType": "formative",
    "choices": [
      {
        "tagDeltas": {
          "lingua": 2
        }
      },
      {
        "tagDeltas": {
          "social": 1
        }
      }
    ]
  },
  {
    "eventId": "young_meet_important_person",
    "stage": "uni",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "stem": 2
        },
        "optionalTraitId": "curious"
      },
      {
        "tagDeltas": {
          "discipline": 1
        }
      }
    ]
  },
  {
    "eventId": "young_adults_idiots",
    "stage": "uni",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "stem": 2
        }
      },
      {
        "tagDeltas": {
          "curiosity": 1
        }
      }
    ]
  },
  {
    "eventId": "young_big_mistake",
    "stage": "uni",
    "weightType": "formative",
    "choices": [
      {
        "tagDeltas": {
          "lingua": 2
        }
      },
      {
        "tagDeltas": {
          "social": 1
        }
      }
    ]
  },
  {
    "eventId": "young_secret_relationship",
    "stage": "uni",
    "weightType": "everyday",
    "choices": [
      {
        "tagDeltas": {
          "stem": 2
        }
      },
      {
        "tagDeltas": {
          "discipline": 1
        }
      },
      {
        "tagDeltas": {
          "stem": 1
        }
      }
    ]
  }
]

/**
 * @description [Prologue] - Пул сцен для стадии.
 * @return { PrologueScenePoolEntry[] } записи пула
 */
export function getScenePoolEntriesForStage(stage: PrologueSceneStage): PrologueScenePoolEntry[] {
  return PROLOGUE_SCENE_POOL.filter((entry: PrologueScenePoolEntry) => entry.stage === stage)
}
