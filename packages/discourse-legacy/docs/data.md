### OA - Users

cli::import-oa-users import|update

src ->  export const osr-commons/OA_LATEST = '${OSR_ROOT}/osr-directory/pp/${YYYY}_${MM}.json'

    -> write (${OSR_ROOT}/${OSR_ROOT}/osr-directory/pp/invalidUsers.json)
    -> write (${OSR_ROOT}/${OSR_ROOT}/osr-directory/pp/invalidUsersEMail.json)
    -> merge to '${OSR_ROOT}/${OSR_ROOT}/osr-directory/pp/merged.json'

### Discourse Directory Layout

- Intro Page
  - Continent (cat, +tags)
    - country page (+tags, +lang)
      - item (+tags, +lang)

- External feeds
  - social
  - products
  - osr content
  - news
