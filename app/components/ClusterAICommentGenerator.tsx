"use client";

import { useMemo } from "react";
import { UserData } from "@/lib/data/users";
import { calculateScore } from "@/lib/utils/calculateScore";
import { isHighStress } from "@/lib/utils/evaluateHighStress";
import { calculateSubscaleScores } from "@/lib/utils/calculateSubscaleScores";
import { SUBSCALES } from "@/lib/utils/subscaleMeta";
import AICommentGenerator from "./AICommentGenerator";

interface Props {
  users: UserData[];
}

export default function ClusterAICommentGenerator({ users }: Props) {
  const {
    avgA,
    avgB,
    avgC,
    intA,
    intB,
    intC,
    highStress,
    filteredSubscale,
    clusterInfo,
  } = useMemo(() => {
    if (users.length === 0) {
      return {
        avgA: 0,
        avgB: 0,
        avgC: 0,
        highStress: false,
        filteredSubscale: {},
        clusterInfo: {},
      } as any;
    }

    // domain scores average
    let sumA = 0,
      sumB = 0,
      sumC = 0;

    // subscale accumulators
    const subAgg: Record<string, { raw: number; eval: number; reverse: boolean; label: string }> = {} as any;
    SUBSCALES.forEach((s) => {
      subAgg[s.id] = { raw: 0, eval: 0, reverse: !!s.reverse, label: s.label.replace(/★$/, "") };
    });

    users.forEach((u) => {
      const dom = calculateScore(u.responses);
      sumA += dom.A;
      sumB += dom.B;
      sumC += dom.C;

      const subs = calculateSubscaleScores(u.responses, u.gender);
      SUBSCALES.forEach((s) => {
        subAgg[s.id].raw += subs[s.id]?.raw ?? 0;
        subAgg[s.id].eval += subs[s.id]?.eval ?? 0;
      });
    });

    const avgAraw = sumA / users.length;
    const avgBraw = sumB / users.length;
    const avgCraw = sumC / users.length;

    const intA = Math.round(avgAraw);
    const intB = Math.round(avgBraw);
    const intC = Math.round(avgCraw);

    const avgA = Math.round(avgAraw * 10) / 10;
    const avgB = Math.round(avgBraw * 10) / 10;
    const avgC = Math.round(avgCraw * 10) / 10;

    // average subscale
    const avgSubs: Record<string, { label: string; reverse: boolean; raw: number; eval: number }> = {};
    SUBSCALES.forEach((s) => {
      avgSubs[s.id] = {
        label: subAgg[s.id].label,
        reverse: subAgg[s.id].reverse,
        raw: Math.round((subAgg[s.id].raw / users.length) * 10) / 10,
        eval: Math.round((subAgg[s.id].eval / users.length) * 10) / 10,
      };
    });

    // filter for prompt: eval>=3.5 or reverse and <=2.5
    const filtered: typeof avgSubs = {} as any;
    Object.entries(avgSubs).forEach(([id, v]) => {
      if ((v.reverse && v.eval <= 2.5) || (!v.reverse && v.eval >= 3.5)) {
        filtered[id] = v;
      }
    });

    // determine high stress on rounded ints (closer to original rule)
    const highStress = isHighStress({ A: intA, B: intB, C: intC });

    // basic cluster info summary strings
    const departments = new Map<string, number>();
    const genders = new Map<string, number>();
    const locations = new Map<string, number>();
    users.forEach((u) => {
      departments.set(u.department, (departments.get(u.department) ?? 0) + 1);
      genders.set(u.gender, (genders.get(u.gender) ?? 0) + 1);
      locations.set(u.location, (locations.get(u.location) ?? 0) + 1);
    });

    const percent = (count: number) => Math.round((count / users.length) * 100);
    const summary = (m: Map<string, number>) =>
      Array.from(m.entries())
        .map(([k, v]) => `${k}${percent(v)}%`)
        .join(" / ");

    const clusterInfo = {
      department: summary(departments),
      gender: summary(genders),
      location: summary(locations),
      yearsOfService: Math.round(users.reduce((acc, u) => acc + u.yearsOfService, 0) / users.length),
    };

    return { avgA, avgB, avgC, intA, intB, intC, highStress, filteredSubscale: filtered, clusterInfo };
  }, [users]);

  return (
    <AICommentGenerator
      scores={{
        scoreA: intA,
        scoreB: intB,
        scoreC: intC,
        total: intA + intB + intC,
        highStress,
      }}
      subscaleScores={filteredSubscale}
      userName="クラスタ平均"
      department={clusterInfo.department}
      gender={undefined}
      age={undefined}
      yearsOfService={clusterInfo.yearsOfService}
      // location not directly supported, but could be embedded in department string
      isCluster={true}
    />
  );
}

