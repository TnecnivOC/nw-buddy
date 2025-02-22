import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  TemplateRef,
  TrackByFunction,
  ViewChild,
} from '@angular/core'
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { Gamemodes, Housingitems, ItemDefinitionMaster, Mutationdifficulty } from '@nw-data/types'
import { combineLatest, defer, map, of, switchMap, takeUntil } from 'rxjs'
import { NwModule, NwService } from '~/nw'
import { getItemIconPath, getItemId, getItemRarity } from '~/nw/utils'
import { DifficultyRank } from '~/preferences'
import { DestroyService, observeRouteParam, shareReplayRefCount } from '~/utils'
import { ItemDetailModule } from '~/widgets/item-detail'
import { VitalsFamiliesModule } from '~/widgets/vitals-families'
import { DungeonsService } from './dungeons.service'

const DIFFICULTY_TIER_NAME = {
  1: 'Normal',
  2: 'Intermediate',
  3: 'Hard',
  4: 'Elite',
}
const MAP_EMBED_URLS = {
  DungeonAmrine: 'https://aeternum-map.gg/Amrine%20Excavation?embed=true',
  DungeonShatteredObelisk: 'https://aeternum-map.gg/Starstone%20Barrows?embed=true',
  DungeonRestlessShores01: 'https://aeternum-map.gg/The%20Depths?embed=true',
  DungeonEbonscale00: 'https://aeternum-map.gg/?bounds=4435,4132.5,5076.5,4673&embed=true',
  DungeonEdengrove00: 'https://aeternum-map.gg/Garden%20of%20Genesis?embed=true',
  DungeonReekwater00: 'https://aeternum-map.gg/Lazarus%20Instrumentality?embed=true',
  DungeonCutlassKeys00: 'https://aeternum-map.gg/Barnacles%20&%20Black%20Powder?embed=true',
  DungeonBrimstoneSands00: 'https://aeternum-map.gg/The%20Ennead?embed=true',
  DungeonShatterMtn00: "https://aeternum-map.gg/Tempest's%20Heart?embed=true",
  QuestApophis: null
}


export interface Tab {
  id: string
  label: string
  tpl: TemplateRef<unknown>
}
@Component({
  standalone: true,
  selector: 'nwb-dungeon-detail',
  templateUrl: './dungeon-detail.component.html',
  styleUrls: ['./dungeon-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NwModule, ItemDetailModule, VitalsFamiliesModule],
  providers: [DestroyService],
  host: {
    class: 'layout-col xl:flex-row'
  }
})
export class DungeonDetailComponent implements OnInit {
  public trackById: TrackByFunction<ItemDefinitionMaster | Housingitems> = (i, item) => getItemId(item)
  public trackByIndex: TrackByFunction<any> = (i, item) => i
  public trackByTabId: TrackByFunction<Tab> = (i, item) => item.id

  public dungeonId$ = defer(() => observeRouteParam(this.route, 'id'))
  public mutationParam$ = defer(() => observeRouteParam(this.route, 'mutation')).pipe(
    map((it) => Number(it) || undefined)
  )
  public tabParam$ = defer(() => observeRouteParam(this.route, 'tab'))

  public dungeon$ = defer(() => this.dungeonId$)
    .pipe(switchMap((id) => this.ds.dungeon(id)))
    .pipe(shareReplayRefCount(1))

  public bosses$ = defer(() => this.dungeon$)
    .pipe(switchMap((it) => this.ds.dungeonBosses(it)))
    .pipe(shareReplayRefCount(1))

  public difficulties$ = defer(() => this.dungeon$)
    .pipe(switchMap((it) => this.ds.dungeonDifficulties(it)))
    .pipe(shareReplayRefCount(1))

  public difficultiesRank$ = defer(() =>
    combineLatest({
      dungeon: this.dungeon$,
      difficulties: this.difficulties$,
    })
  )
    .pipe(
      switchMap(({ dungeon, difficulties }) =>
        combineLatest(
          difficulties.map((it) => {
            return combineLatest({
              difficulty: of(it),
              rank: this.difficultyRank(dungeon, it),
            })
          })
        )
      )
    )
    .pipe(shareReplayRefCount(1))

  public difficulty$ = defer(() =>
    combineLatest({
      difficulties: this.difficulties$,
      difficulty: this.mutationParam$,
    })
  )
    .pipe(map(({ difficulties, difficulty }) => this.ds.dungeonDifficulty(difficulties, Number(difficulty))))
    .pipe(shareReplayRefCount(1))

  public expeditionItems$ = defer(() => this.dungeon$)
    .pipe(switchMap((dungeon) => this.ds.possibleDrops(dungeon)))
    .pipe(map((items) => this.filterAndSort(items)))

  public dungeonLoot$ = defer(() => this.dungeon$)
    .pipe(switchMap((dungeon) => this.ds.lootNormalMode(dungeon)))
    .pipe(map((it) => this.filterAndSort(it)))

  public dungeonMutatedLoot$ = defer(() => this.dungeon$)
    .pipe(switchMap((dungeon) => this.ds.lootMutatedMode(dungeon)))
    .pipe(map((it) => this.filterAndSort(it)))

  public dungeonDifficultyLoot$ = defer(() => combineLatest([this.dungeon$, this.difficulty$]))
    .pipe(switchMap(([dungeon, difficulty]) => this.ds.lootMutatedModeForDifficulty(dungeon, difficulty)))
    .pipe(map((it) => this.filterAndSort(it)))

  public difficyltyRewards$ = defer(() =>
    combineLatest({
      rank: this.difficultyRank$,
      difficulty: this.difficulty$,
      events: this.nw.db.gameEventsMap,
      items: this.nw.db.itemsMap,
      loot: this.nw.db.lootTablesMap
    })
  ).pipe(
    map(({ rank, difficulty, events, items, loot }) => {

      if (!difficulty) {
        return []
      }

      return [
        { eventId: difficulty.CompletionEvent1, rankPos: 1, rankId: 'bronze' as DifficultyRank },
        { eventId: difficulty.CompletionEvent2, rankPos: 2, rankId: 'silver' as DifficultyRank },
        { eventId: difficulty.CompletionEvent3, rankPos: 3, rankId: 'gold' as DifficultyRank },
      ]
        .map(({ eventId, rankPos, rankId }, i) => {
          // TODO: cleanup
          const event = events.get(eventId)
          const bucket = loot.get(`Loot_MutDiff${difficulty.MutationDifficulty}T${rankPos}`)
          const bucketItem = bucket.Items?.[0]
          const itemId = bucketItem?.ItemID
          const item = items.get(itemId)

          if (!item) {
            return null
          }
          return {
            RankName: `ui_dungeon_mutator_${rankId}`,
            ItemID: item.ItemID,
            ItemName: item.Name,
            IconPath: getItemIconPath(item),
            Quantity: bucketItem?.Qty || '?',
            Completed: rankId == rank,
            toggle: () => {
              if (rankId == rank) {
                this.updateRank(null)
              } else {
                this.updateRank(rankId)
              }
            },
          }
        })
        .filter((it) => !!it)
    })
  )

  public difficultyRank$ = defer(() =>
    combineLatest({
      dungeon: this.dungeon$,
      difficulty: this.difficulty$,
    })
  ).pipe(switchMap(({ dungeon, difficulty }) => this.difficultyRank(dungeon, difficulty)))

  @ViewChild('tplDungeonLoot', { static: true })
  public tplDungeonLoot: TemplateRef<unknown>

  @ViewChild('tplDungeonMutatedLoot', { static: true })
  public tplDungeonMutatedLoot: TemplateRef<unknown>

  @ViewChild('tplDungeonDifficultyLoot', { static: true })
  public tplDungeonDifficultyLoot: TemplateRef<unknown>

  @ViewChild('tplDungeonBosses', { static: true })
  public tplDungeonBosses: TemplateRef<unknown>

  @ViewChild('tplRewards', { static: true })
  public tplRewards: TemplateRef<unknown>

  @ViewChild('tplDungeonMap', { static: true })
  public tplDungeonMap: TemplateRef<unknown>

  public dungeon: Gamemodes
  public difficulty: Mutationdifficulty
  public tab: string = ''
  public mapEmbed: SafeResourceUrl

  public get title() {
    return this.dungeon?.DisplayName
  }
  public get description() {
    return this.dungeon?.Description
  }
  public get icon() {
    return this.dungeon?.IconPath
  }
  public get backgroundImage() {
    return this.dungeon?.BackgroundImagePath
  }
  public get requiredLevel() {
    return this.dungeon?.RequiredLevel
  }
  public get requiredGearScore() {
    return this.difficulty?.RecommendedGearScore
  }
  public get requirementText() {
    return this.dungeon?.RequirementText
  }
  public get groupSize() {
    return this.dungeon?.MinGroupSize
  }
  public get isMutable() {
    return this.dungeon?.IsMutable
  }
  public get difficultyLevel() {
    return this.difficulty?.MutationDifficulty
  }

  public tabs: Array<Tab>

  public constructor(
    private nw: NwService,
    private ds: DungeonsService,
    private route: ActivatedRoute,
    private destroy: DestroyService,
    private cdRef: ChangeDetectorRef,
    private domSanitizer: DomSanitizer
  ) {
    //
  }

  public ngOnInit(): void {
    combineLatest({
      dungeon: this.dungeon$,
      difficulty: this.difficulty$,
    })
      .pipe(takeUntil(this.destroy.$))
      .subscribe(({ dungeon, difficulty }) => {
        this.dungeon = dungeon
        this.difficulty = difficulty
        this.tabs = []

        if (!difficulty) {
          this.tabs.push({
            id: '',
            label: 'Available Drops',
            tpl: this.tplDungeonLoot,
          })
        } else {
          this.tabs.push({
            id: '',
            label: 'Available Drops',
            tpl: this.tplDungeonMutatedLoot,
          })
          this.tabs.push({
            id: 'difficulty',
            label: 'Difficulty Drops',
            tpl: this.tplDungeonDifficultyLoot,
          })
        }
        this.tabs.push({
          id: 'bosses',
          label: 'Bosses',
          tpl: this.tplDungeonBosses,
        })
        console.log(dungeon.GameModeId)
        const mapUrl = MAP_EMBED_URLS[dungeon.GameModeId]
        this.mapEmbed = mapUrl ? this.domSanitizer.bypassSecurityTrustResourceUrl(mapUrl) : null
        if (this.mapEmbed) {
          this.tabs.push({
            id: 'map',
            label: 'Map',
            tpl: this.tplDungeonMap,
          })
        }
        this.cdRef.detectChanges()
      })

    this.tabParam$.pipe(takeUntil(this.destroy.$)).subscribe((tab) => {
      this.tab = tab || ''
      this.cdRef.detectChanges()
    })
  }

  public itemId(item: ItemDefinitionMaster | Housingitems) {
    return getItemId(item)
  }

  public difficultyTier(item: Mutationdifficulty) {
    return DIFFICULTY_TIER_NAME[item.DifficultyTier] ?? `${item.DifficultyTier}`
  }

  public difficultyRank(dungeon: Gamemodes, difficulty: Mutationdifficulty) {
    if (!dungeon || !difficulty) {
      return of(null)
    }
    return this.ds.preferences.observeRank(dungeon.GameModeId, difficulty.MutationDifficulty)
  }

  public difficultyRankIcon(dungeon: Gamemodes, difficulty: Mutationdifficulty) {
    if (!dungeon || !difficulty) {
      return of(null)
    }
    return this.difficultiesRank$.pipe(
      map((ranks) => {
        const index = ranks.findIndex((it) => it.difficulty.MutationDifficulty === difficulty.MutationDifficulty)
        const rank = ranks[index]?.rank
        if (rank) {
          return this.rankIcon(rank)
        }
        if (ranks.some((it, i) => it.rank && i > index)) {
          return 'assets/icons/expedition/icon_check_glowing.png' // unlocked and passed
        }
        if (ranks[index - 1]?.rank || index === 0) {
          return null // unlocked
        }
        return `assets/icons/expedition/icon_lock_small.png`
      })
    )
  }

  public rankIcon(rank: DifficultyRank) {
    if (rank) {
      return `assets/icons/expedition/mutator_rank_${rank}_sm.png`
    }
    return `assets/icons/expedition/icon_lock_small.png`
  }

  public updateRankToGold() {
    this.updateRank('gold')
  }

  public updateRankToSilver() {
    this.updateRank('silver')
  }

  public updateRankToBronze() {
    this.updateRank('bronze')
  }

  public updateRank(value: DifficultyRank) {
    if (this.dungeon && this.difficulty) {
      this.ds.preferences.updateRank(this.dungeon.GameModeId, this.difficulty.MutationDifficulty, value)
      this.cdRef.markForCheck()
    }
  }

  private filterAndSort(items: Array<ItemDefinitionMaster | Housingitems>) {
    return items
      .filter((it) => getItemRarity(it) >= 1)
      .sort((a, b) => getItemId(a).localeCompare(getItemId(b)))
      .sort((a, b) => getItemRarity(b) - getItemRarity(a))
  }
}
