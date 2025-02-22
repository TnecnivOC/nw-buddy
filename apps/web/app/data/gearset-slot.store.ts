import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { ItemDefinitionMaster, Perks } from '@nw-data/types'
import { combineLatest, from, map, of, switchMap, tap } from 'rxjs'
import { NwDbService } from '~/nw'
import {
  EquipSlot,
  getItemMaxGearScore,
  getItemPerkInfos,
  getItemRarity,
  getItemTierAsRoman,
  getItemTypeName,
  isItemNamed,
} from '~/nw/utils'
import { GearsetRecord, GearsetsDB } from './gearsets.db'
import { ItemInstance, ItemInstancesDB } from './item-instances.db'

export interface GearsetSlotState {
  gearset: GearsetRecord
  item: ItemDefinitionMaster
  instanceId: string
  instance: ItemInstance
  slot: EquipSlot
}

function isConsumable(slot: EquipSlot) {
  return slot?.itemType === 'Consumable'
}

@Injectable()
export class GearsetSlotStore extends ComponentStore<GearsetSlotState> {
  public readonly item$ = this.select(({ item }) => item)
  public readonly itemName$ = this.select(({ item }) => item?.Name)
  public readonly typeName$ = this.select(({ item }) => getItemTypeName(item))
  public readonly tierLabel$ = this.select(({ item }) => getItemTierAsRoman(item?.Tier))
  public readonly isNamed$ = this.select(({ item }) => isItemNamed(item))
  public readonly isConsumable$ = this.select(({ slot }) => isConsumable(slot))
  public readonly instanceId$ = this.select(({ instanceId }) => instanceId)
  public readonly instance$ = this.select(({ instance }) => instance)
  public readonly rarity$ = this.select(({ item, instance }) => {
    if (!item) {
      return 0
    }
    const perks = getItemPerkInfos(item, instance?.perks)
    const perkIds = perks.map((it) => it.perkId).filter((it) => !!it)
    return getItemRarity(item, perkIds)
  })
  public readonly slot$ = this.select(({ slot }) => slot)
  public readonly canRemove$ = this.select(({ item }) => !!item)
  public readonly canBreak$ = this.select(({ instanceId }) => !!instanceId)

  public constructor(private itemDb: ItemInstancesDB, private gearDb: GearsetsDB, private nwdb: NwDbService) {
    super({
      gearset: null,
      item: null,
      instanceId: null,
      instance: null,
      slot: null,
    })
  }

  public readonly useSlot = this.effect<{ gearset: GearsetRecord; slot: EquipSlot }>((value$) => {
    return combineLatest({
      value: value$,
      items: this.nwdb.itemsMap,
    }).pipe(
      switchMap(({ items, value: { gearset, slot } }) => {
        const slotItem = gearset?.slots?.[slot?.id]
        const instanceId = typeof slotItem === 'string' ? slotItem : null
        const instance = typeof slotItem !== 'string' ? slotItem : null
        const query$ = instanceId ? this.itemDb.live((t) => t.get(instanceId)) : of(instance)
        return query$
          .pipe(
            map((instance) => {
              return {
                gearset,
                slot,
                instanceId,
                instance,
                item: items.get(instance?.itemId),
              }
            })
          )
          .pipe(
            tap({
              next: (state) => this.setState(state),
              error: (err) => console.error(err),
            })
          )
      })
    )
  })

  /**
   * Updates a gearset slot
   */
  public readonly updateSlot = this.effect<{ instance?: ItemInstance, instanceId?: string }>((value$) => {
    return value$.pipe(
      switchMap(({ instance, instanceId }) => {
        const gearset = this.get().gearset
        const slot = this.get().slot.id
        const record = makeCopy(gearset)
        record.slots = record.slots || {}
        if (!instanceId && !instance) {
          delete record.slots[slot]
        } else if (instanceId) {
          record.slots[slot] = instanceId
        } else {
          record.slots[slot] = instance
        }
        return this.writeRecord(record)
      })
    )
  })

  public readonly updateGearScore = this.effect<{ gearScore: number }>((value$) => {
    return value$.pipe(
      switchMap(({ gearScore }) => {
        const { gearset, slot, instance, instanceId } = this.get()
        if (instanceId) {
          return this.itemDb.update(instanceId, {
            gearScore: gearScore,
          })
        }
        const record = makeCopy(gearset)
        record.slots = record.slots || {}
        record.slots[slot.id] = {
          ...instance,
          gearScore: gearScore
        }
        return this.writeRecord(record)
      })
    )
  })

  public readonly updatePerk = this.effect<{ perk: Perks; key: string }>((value$) => {
    return value$.pipe(
      switchMap(({ perk, key }) => {
        const { gearset, slot, instance, instanceId } = this.get()
        if (instanceId) {
          return this.itemDb.read(instanceId).then((record) => {
            return this.itemDb.update(instanceId, {
              perks: {
                ...(record.perks || {}),
                [key]: perk.PerkID,
              },
            })
          })
        }

        return this.writeRecord({
          ...gearset,
          slots: {
            ...(gearset.slots || {}),
            [slot.id]: {
              ...instance,
              perks: {
                ...(instance.perks || {}),
                [key]: perk.PerkID,
              },
            },
          },
        })
      })
    )
  })

  private writeRecord(record: GearsetRecord) {
    return from(this.gearDb.update(record.id, record)).pipe(
      tap({
        next: (value) => this.useSlot({ gearset: value, slot: this.get().slot }),
        error: (e) => console.error(e),
      })
    )
  }
}

function makeCopy<T>(it: T): T {
  return JSON.parse(JSON.stringify(it))
}
