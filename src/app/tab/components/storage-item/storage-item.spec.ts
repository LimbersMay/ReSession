import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StorageItem } from './storage-item';

describe('StorageItem', () => {
  let component: StorageItem;
  let fixture: ComponentFixture<StorageItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StorageItem]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StorageItem);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
