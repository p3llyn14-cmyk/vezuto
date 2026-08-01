"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getDictionary } from "@/i18n";
import type { OrderDraft } from "../wizard-types";

interface Props {
  draft: OrderDraft;
  onChange: (patch: Partial<OrderDraft>) => void;
  photos: File[];
  onPhotosChange: (photos: File[]) => void;
  errors?: Record<string, string[]>;
}

export function StepItem({ draft, onChange, photos, onPhotosChange, errors }: Props) {
  const t = getDictionary().orders;
  const ts = t.steps.item;

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const next = [...photos, ...Array.from(fileList)].slice(0, 8);
    onPhotosChange(next);
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="itemTitle">{ts.itemTitle}</Label>
        <Input
          id="itemTitle"
          value={draft.itemTitle}
          onChange={(e) => onChange({ itemTitle: e.target.value })}
          placeholder={ts.itemTitlePlaceholder}
        />
        <FieldError messages={errors?.itemTitle} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="itemCategory">{ts.itemCategory}</Label>
        <Select
          value={draft.itemCategory}
          onValueChange={(value) =>
            onChange({ itemCategory: value as OrderDraft["itemCategory"] })
          }
        >
          <SelectTrigger id="itemCategory" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(t.itemCategories).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError messages={errors?.itemCategory} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="itemDescription">{ts.itemDescription}</Label>
        <Textarea
          id="itemDescription"
          value={draft.itemDescription}
          onChange={(e) => onChange({ itemDescription: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="externalListingUrl">{ts.externalListingUrl}</Label>
        <Input
          id="externalListingUrl"
          type="url"
          value={draft.externalListingUrl}
          onChange={(e) => onChange({ externalListingUrl: e.target.value })}
          placeholder="https://…"
        />
        <FieldError messages={errors?.externalListingUrl} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="itemCount">{ts.itemCount}</Label>
        <Input
          id="itemCount"
          type="number"
          min={1}
          max={20}
          value={draft.itemCount}
          onChange={(e) => onChange({ itemCount: e.target.value })}
          className="max-w-24"
        />
      </div>

      <div className="space-y-2">
        <Label>{ts.dimensions}</Label>
        <div className="grid grid-cols-3 gap-3">
          <Input
            aria-label={ts.length}
            type="number"
            placeholder={ts.length}
            value={draft.lengthCm}
            onChange={(e) => onChange({ lengthCm: e.target.value })}
          />
          <Input
            aria-label={ts.width}
            type="number"
            placeholder={ts.width}
            value={draft.widthCm}
            onChange={(e) => onChange({ widthCm: e.target.value })}
          />
          <Input
            aria-label={ts.height}
            type="number"
            placeholder={ts.height}
            value={draft.heightCm}
            onChange={(e) => onChange({ heightCm: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="estimatedWeightKg">{ts.estimatedWeightKg}</Label>
        <Input
          id="estimatedWeightKg"
          type="number"
          min={0}
          className="max-w-32"
          value={draft.estimatedWeightKg}
          onChange={(e) => onChange({ estimatedWeightKg: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="photos">{ts.photos}</Label>
        <Input
          id="photos"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
        />
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {photos.map((file, i) => (
              <span
                key={`${file.name}-${i}`}
                className="bg-muted text-muted-foreground rounded-md px-2 py-1 text-xs"
              >
                {file.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-destructive text-xs">{messages[0]}</p>;
}
